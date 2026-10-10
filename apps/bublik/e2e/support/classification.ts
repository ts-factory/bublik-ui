/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, test } from '@playwright/test';
import type { APIRequestContext, Locator, Page } from '@playwright/test';

/**
 * Every issue the suite records starts with this, so a leftover can be told
 * from an issue somebody triaged by hand and swept away.
 */
const E2E_ISSUE_PREFIX = 'e2e issue';

/**
 * A run tag no run carries, as a rule drawer's tag entry. A write scenario that
 * needs an active rule but no stamps gates the rule on it: Apply Rules on a run
 * another scenario leased then never stamps with the rule.
 */
const NO_RUN_TAG = 'fixture_id=e2e:no-such-run';

/** Category slug → the short label its badge shows. */
const CATEGORY_BADGE = {
	'product-defect': 'Defect',
	'test-bug': 'Test Bug',
	env: 'Env',
	'known-issue': 'Known',
	flaky: 'Flaky',
	'to-investigate': 'Investigate'
} as const;

type IssueCategory = keyof typeof CATEGORY_BADGE;

/** Category slug → the help line the forms show under a picked category. */
const CATEGORY_HINT = {
	'product-defect':
		'A real defect in the product under test. Counts as unexpected.',
	'test-bug': 'A bug in the test or the automation, not in the product.',
	env: 'Caused by the environment or the infrastructure.',
	'known-issue': 'A known, already-triaged failure.',
	flaky: 'Passes and fails without a change in the product.',
	'to-investigate': 'Noted, but nobody has worked out the cause yet.'
} as const;

/** `rules_state` → the label the Rules badge shows when the issue has no rules. */
const RULES_STATE_LABEL = {
	enforced: 'Active',
	dormant: 'No active rules',
	deactivated: 'Deactivated',
	unruled: 'No rules'
} as const;

/** Run effect → what the Effect On Run badge reads. */
const EFFECT_BADGE = {
	suppressed: 'Suppressed',
	stale: 'Again',
	unexpected: 'Counts',
	marked: 'Undecided'
} as const;

/** Run effect → what the Effect On Run filter calls it. */
const EFFECT_DISPLAY = {
	suppressed: 'Suppressed',
	stale: 'Counting again',
	unexpected: 'Still counts',
	marked: 'Undecided'
} as const;

type RunIssueEffect = keyof typeof EFFECT_BADGE;

/** The sonner toast that carries `text`. */
function toast(page: Page, text: string | RegExp): Locator {
	return page.locator('[data-sonner-toast]').filter({ hasText: text }).first();
}

async function expectToast(page: Page, text: string | RegExp): Promise<void> {
	await expect(toast(page, text)).toBeVisible({ timeout: 30_000 });
}

/**
 * Clicks an Apply Rules button and resolves with its toast's wording, once
 * the toast of any earlier apply on the page has gone so it is not read as
 * this one's.
 */
async function applyRulesWith(page: Page, button: Locator): Promise<string> {
	const applied = page
		.locator('[data-sonner-toast]')
		.filter({ hasText: /^Applied — / });

	await expect(applied).toHaveCount(0, { timeout: 15_000 });
	await expect(button).toBeEnabled({ timeout: 30_000 });
	await button.click();
	await expect(applied.first()).toBeVisible({ timeout: 60_000 });

	return (await applied.first().innerText()).trim();
}

/** The confirm dialog titled `title` (an alert dialog with Cancel and a verb). */
function confirmDialog(page: Page, title: string | RegExp): Locator {
	return page.getByRole('alertdialog').filter({ hasText: title });
}

async function confirm(page: Page, title: string | RegExp, verb = 'Delete') {
	const dialog = confirmDialog(page, title);

	await expect(dialog).toBeVisible({ timeout: 15_000 });
	await dialog.getByRole('button', { name: verb, exact: true }).click();
	await expect(dialog).toBeHidden({ timeout: 15_000 });
}

interface IssueListPayload {
	results?: { id: number; title: string; project: number }[];
}

async function deleteIssueViaApi(
	request: APIRequestContext,
	issueId: number,
	projectId?: number
): Promise<void> {
	const search = projectId === undefined ? '' : `?project=${projectId}`;

	await request
		.delete(`/api/v2/issues/${issueId}/${search}`)
		.catch(() => undefined);
}

/**
 * The issues one spec records, and the net that catches the ones it failed to
 * delete through the UI.
 *
 * Every scenario deletes its own issue as its last step — through the UI,
 * like everything else it does. A scenario that fails midway leaves its issue
 * (and the stamps its rules laid) behind, and a suppressed stamp changes the
 * run's unexpected counts for every spec after it. So `sweep()` runs in
 * `afterEach`: it deletes the ids the spec registered, then anything whose
 * title starts with this spec's own prefix, in case the id was never read.
 *
 * Scoped by `scope` and by the running browser project, so neither two specs
 * in parallel workers nor one spec running in two browsers at once ever sweep
 * each other's issues mid-scenario.
 */
class IssueCleanup {
	private readonly registered = new Map<number, number | undefined>();
	private readonly scope: string;
	private readonly project: () => string;

	/**
	 * @param project The browser project the scenario runs in; the running
	 *   test's by default.
	 */
	constructor(
		scope: string,
		project: () => string = () => test.info().project.name
	) {
		this.scope = scope;
		this.project = project;
	}

	/** A title no other scenario — or run of this one — can collide with. */
	title(label: string): string {
		return `${this.prefix} ${label} ${Date.now().toString(36)}`;
	}

	get prefix(): string {
		return `${E2E_ISSUE_PREFIX} ${this.scope} ${this.project()}`;
	}

	/** Whether `title` is one this scope recorded in this browser project. */
	owns(title: string): boolean {
		return title.startsWith(`${this.prefix} `);
	}

	register(issueId: number, projectId?: number): void {
		this.registered.set(issueId, projectId);
	}

	forget(issueId: number): void {
		this.registered.delete(issueId);
	}

	async sweep(request: APIRequestContext): Promise<void> {
		for (const [issueId, projectId] of this.registered) {
			await deleteIssueViaApi(request, issueId, projectId);
		}
		this.registered.clear();

		const response = await request
			.get(
				`/api/v2/issues/?search=${encodeURIComponent(
					this.prefix
				)}&page_size=100`
			)
			.catch(() => null);

		if (!response?.ok()) return;

		const payload = (await response
			.json()
			.catch(() => null)) as IssueListPayload | null;

		for (const issue of payload?.results ?? []) {
			if (!this.owns(issue.title)) continue;

			await deleteIssueViaApi(request, issue.id, issue.project);
		}
	}
}

/**
 * Types `title` into an issue picker and picks the matching option.
 *
 * The popup is meant to open as the text changes, but a select that closed
 * just before can hand focus back to its trigger and blur the input, closing
 * the popup again. The picker's own "Open issue list" button reopens it with
 * the typed text as the search.
 */
async function pickIssueOption(
	page: Page,
	picker: Locator,
	title: string
): Promise<void> {
	const input = picker.getByTestId('issue-picker-input');
	const option = page
		.locator('[data-testid="issue-picker-option"]')
		.filter({ hasText: title })
		.first();

	await input.click();
	await input.fill(title);

	const opened = await option
		.waitFor({ state: 'visible', timeout: 5_000 })
		.then(() => true)
		.catch(() => false);

	if (!opened) {
		await picker.getByRole('button', { name: 'Open issue list' }).click();
	}

	await expect(option).toBeVisible({ timeout: 15_000 });
	await option.click();
	await expect(input).toHaveValue(title);
}

/** Playwright's `getByRole` name for a Radix select option that also carries a description. */
function optionName(label: string): RegExp {
	return new RegExp(`^${escapeRegExp(label)}(\\s|$)`);
}

/** The faceted filter option "<label> (<count>)", whatever the count. */
function facetOptionName(label: string): RegExp {
	return new RegExp(`^${escapeRegExp(label)} \\(\\d+\\)$`);
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export {
	CATEGORY_BADGE,
	CATEGORY_HINT,
	E2E_ISSUE_PREFIX,
	EFFECT_BADGE,
	EFFECT_DISPLAY,
	IssueCleanup,
	NO_RUN_TAG,
	RULES_STATE_LABEL,
	applyRulesWith,
	confirm,
	confirmDialog,
	escapeRegExp,
	expectToast,
	facetOptionName,
	optionName,
	pickIssueOption,
	toast
};
export type { IssueCategory, RunIssueEffect };
