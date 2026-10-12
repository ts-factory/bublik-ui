/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/**
 * The round-trip corpus, built from the repo's own URL oracles so the codec
 * tests fail when the e2e suite starts pinning a query string the codecs do
 * not reproduce:
 *
 * - the committed URL snapshot (`e2e/snapshots/url-snapshot.json`): every
 *   visited URL, every internal link and every scripted write;
 * - every URL literal in the e2e specs and page objects;
 * - the `*_URL_PARAMS` tables, whose documented value sets become `key=value`
 *   pairs;
 * - sidebar `_s` blobs encoded by `support/sidebar-state.ts` itself.
 *
 * The tables and the sidebar encoder are loaded at run time from the app, by
 * computed path, like the snapshot JSON: they are the oracle this lib's codecs
 * are checked against, not a dependency of the lib, so the dependency graph
 * (and `@nx/enforce-module-boundaries`) does not see them on purpose.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const E2E_DIR = resolve(
	dirname(fileURLToPath(import.meta.url)),
	'../../../../../apps/bublik/e2e'
);

function walk(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const full = join(dir, name);

		if (statSync(full).isDirectory()) return walk(full);

		return full.endsWith('.ts') ? [full] : [];
	});
}

/** The query string of a URL without its `?` and `#hash`, or `undefined`. */
function queryOf(url: string): string | undefined {
	const index = url.indexOf('?');
	if (index === -1) return undefined;

	const query = url.slice(index + 1).split('#')[0];

	return query.length ? query : undefined;
}

/** Every URL-looking string in the snapshot: visited URLs, links, writes. */
function snapshotUrls(): string[] {
	const text = readFileSync(
		join(E2E_DIR, 'snapshots/url-snapshot.json'),
		'utf8'
	);
	const out = new Set<string>();

	const visit = (value: unknown): void => {
		if (typeof value === 'string') {
			if (value.startsWith('/') || value.startsWith('?')) out.add(value);
		} else if (Array.isArray(value)) {
			value.forEach(visit);
		} else if (value && typeof value === 'object') {
			Object.values(value).forEach(visit);
		}
	};

	visit(JSON.parse(text));

	return [...out].sort();
}

/** Every query string in the URL snapshot. */
function snapshotQueries(): string[] {
	const out = new Set<string>();

	for (const url of snapshotUrls()) {
		const query = queryOf(url);
		if (query) out.add(query);
	}

	return [...out].sort();
}

/**
 * Every string literal with a `?key=value` query inside the e2e suite,
 * skipping literals that interpolate a template expression.
 */
function specLiteralQueries(): string[] {
	const out = new Set<string>();

	for (const file of walk(E2E_DIR)) {
		const source = readFileSync(file, 'utf8');

		for (const match of source.matchAll(
			/['"`]([^'"`\s]*\?[^'"`\s$]*=[^'"`\s$]*)['"`]/g
		)) {
			const query = queryOf(match[1]);
			if (query && !query.includes('${')) out.add(query);
		}
	}

	return [...out].sort();
}

interface ParamTableEntry {
	codec?: string;
	values?: string;
}

type ParamTable = Record<string, ParamTableEntry>;

interface ParamTables {
	/** `TABLE_NAME.key` → the table entry, for every `*_URL_PARAMS` export. */
	entries: Record<string, ParamTableEntry>;
	/** `key=value` pairs built from every documented value, plus `key=`. */
	queries: string[];
}

/** Loads every `*_URL_PARAMS` table exported by the e2e page objects. */
async function paramTables(): Promise<ParamTables> {
	const entries: Record<string, ParamTableEntry> = {};
	const queries = new Set<string>();

	for (const file of walk(join(E2E_DIR, 'pages'))) {
		const mod = await loadE2eModule(file);

		for (const [name, table] of Object.entries(mod)) {
			if (!name.endsWith('_URL_PARAMS') || !table || typeof table !== 'object')
				continue;

			for (const [key, meta] of Object.entries(table as ParamTable)) {
				entries[`${name}.${key}`] = meta;
				queries.add(`${encodeURIComponent(key)}=`);

				for (const value of String(meta.values ?? '')
					.split('|')
					.map((it) => it.trim())
					.filter(Boolean)) {
					const params = new URLSearchParams();
					params.set(key, value);
					queries.add(params.toString());
				}
			}
		}
	}

	return { entries, queries: [...queries].sort() };
}

/** Loads one e2e source file, outside this project, by computed path. */
async function loadE2eModule(file: string): Promise<Record<string, unknown>> {
	return (await import(/* @vite-ignore */ pathToFileURL(file).href)) as Record<
		string,
		unknown
	>;
}

type SidebarStateValues = Record<string, string | string[]>;

/** Three synthetic sidebar states in the shape the e2e fixture encodes. */
const SIDEBAR_STATE_SAMPLES: SidebarStateValues[] = [
	{ rs: ['1', '2', '3'], cr: '1', rll: 'page=2&mode=table' },
	{ hl: 'testName=foo&mode=linear', du: 'dates=2025-01-01' },
	{ ll: '/log/42?mode=treeAndinfoAndlog&focusId=0336&lineNumber=1_42' }
];

interface SidebarStateBlob {
	values: SidebarStateValues;
	/** The `_s` value as the e2e fixture's own `encodeSidebarState` writes it. */
	blob: string;
}

/**
 * The sample states encoded by `support/sidebar-state.ts` itself: the fixture
 * ships the encoder, not sample blobs.
 */
async function sidebarStateBlobs(): Promise<SidebarStateBlob[]> {
	const { encodeSidebarState } = (await loadE2eModule(
		join(E2E_DIR, 'support/sidebar-state.ts')
	)) as { encodeSidebarState: (values: SidebarStateValues) => string };

	return SIDEBAR_STATE_SAMPLES.map((values) => ({
		values,
		blob: encodeSidebarState(values)
	}));
}

export {
	E2E_DIR,
	paramTables,
	queryOf,
	sidebarStateBlobs,
	snapshotQueries,
	snapshotUrls,
	specLiteralQueries
};
export type { ParamTableEntry, ParamTables, SidebarStateBlob };
