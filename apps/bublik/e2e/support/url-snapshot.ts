/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { expect } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { decompressFromEncodedURIComponent } from 'lz-string';

/**
 * The URL snapshot is the "nothing changed" proof for the router migration.
 *
 * For every route it records the address the browser ends up on, every
 * internal link the page renders, and, for a set of scripted writes, the query
 * string that comes out and whether the history grew (push) or not (replace).
 * The JSON beside this file is committed; a migration PR diffs against it.
 *
 * Three things are normalised, each because it cannot be stable between runs:
 * the compressed sidebar memory `_s` (its presence is kept as a flag, its
 * content is pinned by `sidebar-state.ts`), the UUIDs the chat page mints for
 * new threads, and the key order inside values that are JSON or lz-string
 * compressed JSON (the run table writes its `expanded` map in whatever order
 * the rows happened to open). Such values are recorded as `lz:` or `json:`
 * plus the object with its keys sorted, so a change of codec still shows up as
 * a diff. Everything else is compared byte for byte, including the
 * percent-encoding and the order of the query keys themselves.
 *
 * Fixture ids (runs, results, issues, configs) come from the seeded database
 * and are stable for a given seed plan, which is what CI runs against.
 */

const SNAPSHOT_FILE = path.resolve(__dirname, '../snapshots/url-snapshot.json');

const SIDEBAR_STATE_KEY = '_s';

const UUID_PATTERN =
	/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

const SETTLE_QUIET_MS = 1_500;

const SETTLE_TIMEOUT_MS = 15_000;

type HistoryMove = 'push' | 'replace' | 'none';

interface VisitOptions {
	/** `false` records the address but not the links (live-data lists). */
	links?: boolean;
}

interface VisitRecord {
	url: string;
	sidebarState: boolean;
	links: string[];
}

interface WriteRecord {
	before: string;
	after: string;
	history: HistoryMove;
	entries: number;
	/** Whether `_s` was on the URL before and after, and whether it changed. */
	sidebarState: { before: boolean; after: boolean; changed: boolean };
}

interface GroupRecord {
	visits: Record<string, VisitRecord>;
	writes: Record<string, WriteRecord>;
}

type Snapshot = Record<string, GroupRecord>;

function stableStringify(value: unknown): string {
	if (Array.isArray(value)) {
		return `[${value.map(stableStringify).join(',')}]`;
	}

	if (value && typeof value === 'object') {
		const entries = Object.entries(value as Record<string, unknown>)
			.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
			.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`);

		return `{${entries.join(',')}}`;
	}

	return JSON.stringify(value);
}

function parseStructured(text: string): unknown | undefined {
	if (!/^[[{]/.test(text)) return undefined;

	try {
		const parsed: unknown = JSON.parse(text);

		return parsed && typeof parsed === 'object' ? parsed : undefined;
	} catch {
		return undefined;
	}
}

/**
 * A query value that is JSON, or lz-string compressed JSON, is recorded with
 * its object keys sorted and a prefix naming the codec. Anything else is
 * returned untouched.
 */
function canonicalizeValue(rawValue: string): string {
	let decoded: string;
	let percentDecoded: string;
	try {
		decoded = decodeURIComponent(rawValue.replace(/\+/g, ' '));
		// lz-string's URI-safe alphabet contains `+`, which the app writes as
		// `%2B`; it must come back as `+`, not as a space.
		percentDecoded = decodeURIComponent(rawValue);
	} catch {
		return rawValue;
	}

	const json = parseStructured(decoded);
	if (json !== undefined) return `json:${stableStringify(json)}`;

	const inflated = decompressFromEncodedURIComponent(percentDecoded);
	if (inflated) {
		const compressed = parseStructured(inflated);
		if (compressed !== undefined) return `lz:${stableStringify(compressed)}`;
	}

	return rawValue;
}

interface NormalizedSearch {
	search: string;
	sidebarState: boolean;
	/** The raw `_s` value, for change detection; never recorded. */
	sidebarStateValue: string | null;
}

/**
 * Takes a search string (with or without the leading `?`), drops `_s` and
 * canonicalises structured values. The pairs are handled textually so the
 * other values stay exactly as the app wrote them; re-serialising through
 * URLSearchParams would hide encoding drift.
 */
function normalizeSearch(rawSearch: string): NormalizedSearch {
	const search = rawSearch.startsWith('?') ? rawSearch.slice(1) : rawSearch;
	const pairs = search.split('&').filter((pair) => pair !== '');
	let sidebarStateValue: string | null = null;
	const kept: string[] = [];

	for (const pair of pairs) {
		const equals = pair.indexOf('=');
		const key = equals === -1 ? pair : pair.slice(0, equals);

		if (key === SIDEBAR_STATE_KEY) {
			sidebarStateValue = equals === -1 ? '' : pair.slice(equals + 1);
			continue;
		}

		kept.push(
			equals === -1
				? pair
				: `${key}=${canonicalizeValue(pair.slice(equals + 1))}`
		);
	}

	return {
		search: kept.length ? `?${kept.join('&')}` : '',
		sidebarState: sidebarStateValue !== null,
		sidebarStateValue
	};
}

interface NormalizedHref {
	url: string;
	sidebarState: boolean;
	sidebarStateValue: string | null;
}

function normalizeHref(href: string, baseURL: string): NormalizedHref | null {
	let parsed: URL;
	try {
		parsed = new URL(href, baseURL);
	} catch {
		return null;
	}

	if (parsed.origin !== new URL(baseURL).origin) return null;

	const { search, sidebarState, sidebarStateValue } = normalizeSearch(
		parsed.search
	);
	const url = `${parsed.pathname}${search}${parsed.hash}`.replace(
		UUID_PATTERN,
		'<uuid>'
	);

	return { url, sidebarState, sidebarStateValue };
}

function currentLocation(page: Page, baseURL: string): NormalizedHref {
	const normalized = normalizeHref(page.url(), baseURL);
	if (!normalized) throw new Error(`Left the deployment: ${page.url()}`);

	return normalized;
}

async function readLinks(page: Page, baseURL: string): Promise<string[]> {
	const hrefs = await page
		.locator('a[href]')
		.evaluateAll((anchors) =>
			anchors.map((anchor) => (anchor as HTMLAnchorElement).href)
		);
	const links = new Set<string>();

	for (const href of hrefs) {
		const normalized = normalizeHref(href, baseURL);
		if (normalized) links.add(normalized.url);
	}

	return [...links].sort();
}

/**
 * Pages render their links in waves (data, then tables, then a table of
 * contents), and the sidebar memory is written a tick after that. There is no
 * DOM event for "finished", so this polls `read` until its value has not
 * changed for a quiet period, and returns that last value.
 */
async function waitForQuiet(
	page: Page,
	read: () => Promise<string>
): Promise<string> {
	const deadline = Date.now() + SETTLE_TIMEOUT_MS;
	let last = await read();
	let quietSince = Date.now();

	while (Date.now() < deadline) {
		// eslint-disable-next-line playwright/no-wait-for-timeout
		await page.waitForTimeout(250);
		const next = await read();

		if (next !== last) {
			last = next;
			quietSince = Date.now();
		} else if (Date.now() - quietSince >= SETTLE_QUIET_MS) {
			return last;
		}
	}

	return last;
}

function waitForSettledUrl(page: Page): Promise<string> {
	return waitForQuiet(page, async () => page.url());
}

async function waitForSettledPage(
	page: Page,
	baseURL: string
): Promise<string[]> {
	const settled = await waitForQuiet(page, async () =>
		JSON.stringify([page.url(), await readLinks(page, baseURL)])
	);

	return (JSON.parse(settled) as [string, string[]])[1];
}

async function historyLength(page: Page): Promise<number> {
	return page.evaluate(() => window.history.length);
}

function readSnapshot(): Snapshot {
	if (!existsSync(SNAPSHOT_FILE)) return {};

	return JSON.parse(readFileSync(SNAPSHOT_FILE, 'utf-8')) as Snapshot;
}

function writeSnapshot(snapshot: Snapshot): void {
	const sorted = Object.fromEntries(
		Object.keys(snapshot)
			.sort()
			.map((group) => [group, snapshot[group]])
	);

	mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
	writeFileSync(SNAPSHOT_FILE, `${JSON.stringify(sorted, null, '\t')}\n`);
}

function sameRecord(a: GroupRecord, b: GroupRecord): boolean {
	return stableStringify(a) === stableStringify(b);
}

class UrlSnapshot {
	private readonly record: GroupRecord = { visits: {}, writes: {} };

	constructor(
		private readonly page: Page,
		private readonly group: string,
		private readonly baseURL: string
	) {}

	/**
	 * Open a route and record where the browser lands, whether the sidebar
	 * memory was written, and every internal link on the page. `open` is the
	 * page object's own navigation so the snapshot visits the same addresses
	 * the rest of the suite does.
	 */
	async visit(
		label: string,
		open: () => Promise<unknown>,
		options: VisitOptions = {}
	): Promise<void> {
		this.assertNewLabel(label, this.record.visits);

		await open();
		await this.page.waitForLoadState('load');
		const links = await waitForSettledPage(this.page, this.baseURL);
		const { url, sidebarState } = currentLocation(this.page, this.baseURL);

		this.record.visits[label] = {
			url,
			sidebarState,
			// A page that lists whatever the database holds right now ("latest
			// runs") links to data, not to a URL shape worth pinning.
			links: options.links === false ? [] : links
		};
	}

	/**
	 * Perform a write on the page already open and record the address before
	 * and after, how many history entries it cost, and whether the sidebar
	 * memory changed with it.
	 */
	async write(label: string, action: () => Promise<unknown>): Promise<void> {
		this.assertNewLabel(label, this.record.writes);

		await waitForSettledUrl(this.page);
		const before = currentLocation(this.page, this.baseURL);
		const lengthBefore = await historyLength(this.page);

		await action();
		await waitForSettledUrl(this.page);

		const after = currentLocation(this.page, this.baseURL);
		const entries = (await historyLength(this.page)) - lengthBefore;
		const history: HistoryMove =
			entries > 0 ? 'push' : after.url === before.url ? 'none' : 'replace';

		this.record.writes[label] = {
			before: before.url,
			after: after.url,
			history,
			entries,
			sidebarState: {
				before: before.sidebarState,
				after: after.sidebarState,
				changed: before.sidebarStateValue !== after.sidebarStateValue
			}
		};
	}

	/**
	 * Compare this group with the committed snapshot. With `--update-snapshots`
	 * a differing group is rewritten (`all` rewrites it regardless). Without
	 * it, a group that is not recorded yet is written once on a first attempt
	 * outside CI and still fails, like a missing Playwright snapshot, so the
	 * commit is a deliberate step; a retry or a CI run never writes.
	 */
	async verify(testInfo: TestInfo): Promise<void> {
		const mode = testInfo.config.updateSnapshots;
		const snapshot = readSnapshot();
		const expected = snapshot[this.group];
		const relativeFile = path.relative(process.cwd(), SNAPSHOT_FILE);

		if (mode === 'all' || mode === 'changed') {
			if (mode === 'all' || !expected || !sameRecord(expected, this.record)) {
				snapshot[this.group] = this.record;
				writeSnapshot(snapshot);
			}

			return;
		}

		if (!expected) {
			const mayWrite =
				mode === 'missing' && testInfo.retry === 0 && !process.env['CI'];

			if (mayWrite) {
				snapshot[this.group] = this.record;
				writeSnapshot(snapshot);
			}

			throw new Error(
				`URL snapshot group "${this.group}" is not recorded in ${relativeFile}` +
					(mayWrite
						? '; it has been written now, commit it and re-run'
						: '; record it with --update-snapshots and commit the file')
			);
		}

		expect(this.record, `URL snapshot group "${this.group}"`).toEqual(expected);
	}

	private assertNewLabel(label: string, bucket: Record<string, unknown>) {
		if (label in bucket) {
			throw new Error(
				`URL snapshot group "${this.group}" records "${label}" twice`
			);
		}
	}
}

function urlSnapshot(
	page: Page,
	group: string,
	testInfo: TestInfo
): UrlSnapshot {
	const baseURL = testInfo.project.use.baseURL;
	if (!baseURL) throw new Error('BASE_URL is not set');

	return new UrlSnapshot(page, group, baseURL);
}

export {
	SNAPSHOT_FILE,
	canonicalizeValue,
	normalizeHref,
	normalizeSearch,
	urlSnapshot,
	UrlSnapshot
};
export type {
	GroupRecord,
	HistoryMove,
	Snapshot,
	VisitOptions,
	VisitRecord,
	WriteRecord
};
