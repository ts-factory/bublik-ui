/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import type { Page } from '@playwright/test';

import { expect, test } from './support/test';

import { IssuePage } from './pages/issue-url-page';
import { IssuesPage } from './pages/issues-url-page';
import {
	issueByState,
	projectPairWithIssues,
	richestProject
} from './support/classification-data';
import { and, given, then, when } from './support/gherkin';
import { requireManifest } from './support/manifest';
import { SIDEBAR_ALIASES, sidebarState } from './support/sidebar-state';
import { urlParams } from './support/url-params';

const TAG = { tag: ['@issues', '@needs-classification'] };
const URL_TAG = {
	tag: ['@issues', '@needs-classification', '@url-params']
};

/** The issues list scoped to the project with the most seeded issues. */
async function openRichestProject(
	page: Page,
	params: Record<string, string> = {}
): Promise<{ issuesPage: IssuesPage; projectId: string }> {
	const issuesPage = new IssuesPage(page);
	const projectId = String(richestProject(requireManifest()).projectId);

	await issuesPage.goto({ project: projectId, ...params });
	await issuesPage.expectReady();

	return { issuesPage, projectId };
}

test.describe('Issues', () => {
	test(
		'The issues list shows the seeded issues grouped by project',
		{ tag: ['@issues', '@needs-classification', '@smoke'] },
		async ({ page }) => {
			const issuesPage = new IssuesPage(page);
			const { selected, other } = projectPairWithIssues(requireManifest());

			await given('the fixture manifest seeds issues into two projects', () =>
				expect(selected.projectName).not.toBe(other.projectName)
			);
			await when('I open the issues list for every project', () =>
				issuesPage.goto()
			);
			await then('both projects head a group of issues', () =>
				issuesPage.table.expectGroupedBy([
					selected.projectName,
					other.projectName
				])
			);
			await and('a seeded issue of each project is listed', async () => {
				await issuesPage.table.expectRowListed(selected.issues[0].issueId);
				await issuesPage.table.expectRowListed(other.issues[0].issueId);
			});
		}
	);

	test(
		"Scoping the issues list to a project hides the other projects' issues",
		TAG,
		async ({ page }) => {
			const issuesPage = new IssuesPage(page);
			const { selected, other } = projectPairWithIssues(requireManifest());

			await given('the fixture manifest seeds issues into two projects', () =>
				expect(selected.projectId).not.toBe(other.projectId)
			);
			await when('I open the issues list scoped to one of them', () =>
				issuesPage.goto({ project: String(selected.projectId) })
			);
			await then('only that project heads a group', () =>
				issuesPage.table.expectGroupedBy([selected.projectName], {
					exact: true
				})
			);
			await and("the other project's issue is not listed", async () => {
				await issuesPage.table.expectRowListed(selected.issues[0].issueId);
				await issuesPage.table.expectRowAbsent(other.issues[0].issueId);
			});
		}
	);

	test("An issue's title opens its page", TAG, async ({ page }) => {
		const issuePage = new IssuePage(page);
		const manifest = requireManifest();
		const issue = issueByState(
			manifest,
			'open',
			richestProject(manifest).projectId
		);
		let issuesPage: IssuesPage;

		await given('the issues list shows a seeded issue', async () => {
			issuesPage = (await openRichestProject(page)).issuesPage;
			await issuesPage.table.expectRowListed(issue.issueId);
		});
		await when("I follow the issue's title", () =>
			issuesPage.openIssue(issue.issueId)
		);
		await then("that issue's page is open", () =>
			issuePage.expectLoaded(issue.title)
		);
	});

	test(
		'Searching the issues list records the term and returns to the first page',
		URL_TAG,
		async ({ page }) => {
			const manifest = requireManifest();
			const issue = issueByState(
				manifest,
				'open',
				richestProject(manifest).projectId
			);
			let issuesPage: IssuesPage;

			await given(
				'the issues list is open on its second page of ten',
				async () => {
					issuesPage = (
						await openRichestProject(page, { pageSize: '10', page: '2' })
					).issuesPage;
					await issuesPage.expectParams({ page: '2', pageSize: '10' });
				}
			);
			await when("I search for a seeded issue's title", () =>
				issuesPage.table.search(issue.title)
			);
			await then('the URL records the term and is back on the first page', () =>
				issuesPage.expectParams({ q: issue.title, page: null })
			);
			await and('that issue is listed', () =>
				issuesPage.table.expectRowListed(issue.issueId)
			);
			await when('I clear the search', () => issuesPage.table.search(''));
			await then('the term is dropped from the URL', () =>
				issuesPage.expectParams({ q: null, pageSize: '10' })
			);
		}
	);

	test(
		'Filtering issues by state records the facet and survives a reload',
		URL_TAG,
		async ({ page }) => {
			let issuesPage: IssuesPage;

			await given('the issues list is open', async () => {
				issuesPage = (await openRichestProject(page)).issuesPage;
			});
			await when('I narrow the list to closed issues', () =>
				issuesPage.table.toggleFacetOption('State', 'Closed')
			);
			await then('the URL records the closed state', () =>
				issuesPage.expectParams({ state: 'closed', page: null })
			);
			await and('every listed issue is closed', () =>
				issuesPage.expectEveryRowInState('closed')
			);
			await when('I reload the page', async () => {
				await page.reload();
				await issuesPage.expectReady();
			});
			await then('every listed issue is still closed', async () => {
				await issuesPage.table.expectFacetSelected('State', 'Closed');
				await issuesPage.expectEveryRowInState('closed');
			});
			await when('I reset the filters', () => issuesPage.table.reset());
			await then('the state is dropped from the URL', () =>
				issuesPage.expectParams({ state: null, q: null })
			);
		}
	);

	test(
		'Sorting the issues list cycles through ascending, descending and none',
		URL_TAG,
		async ({ page }) => {
			let issuesPage: IssuesPage;

			await given('the issues list is open', async () => {
				issuesPage = (await openRichestProject(page)).issuesPage;
				await issuesPage.expectParams({ sort: null });
			});
			await when('I sort by the Issue column', () =>
				issuesPage.table.sortBy('Issue')
			);
			await then('the URL records the ascending sort', () =>
				issuesPage.expectParams({ sort: 'issue:asc' })
			);
			await when('I sort by the Issue column again', () =>
				issuesPage.table.sortBy('Issue')
			);
			await then('the URL records the descending sort', () =>
				issuesPage.expectParams({ sort: 'issue:desc' })
			);
			await when('I sort by the Issue column a third time', () =>
				issuesPage.table.sortBy('Issue')
			);
			await then('the URL records that no sort is applied', () =>
				issuesPage.expectParams({ sort: 'none' })
			);
		}
	);

	test(
		'Changing the rows per page records the size and the page',
		URL_TAG,
		async ({ page }) => {
			let issuesPage: IssuesPage;

			await given('the issues list is open', async () => {
				issuesPage = (await openRichestProject(page)).issuesPage;
				await issuesPage.expectParams({ pageSize: null, page: null });
			});
			await when('I show ten issues per page', () =>
				issuesPage.table.setPageSize(10)
			);
			await then('the URL records ten rows per page', async () => {
				await issuesPage.expectParams({ pageSize: '10', page: null });
				await issuesPage.table.expectRowCountAtMost(10);
			});
			await when('I open the next page', () => issuesPage.table.openNextPage());
			await then('the URL records the second page', () =>
				issuesPage.expectParams({ page: '2', pageSize: '10' })
			);
			await when('I show a hundred issues per page', () =>
				issuesPage.table.setPageSize(100)
			);
			await then('the page size and the page are dropped from the URL', () =>
				issuesPage.expectParams({ pageSize: null, page: null })
			);
		}
	);

	test(
		'A page past the end is clamped to the last page',
		URL_TAG,
		async ({ page }) => {
			const issuesPage = new IssuesPage(page);
			const projectId = String(richestProject(requireManifest()).projectId);
			const link = { project: projectId, pageSize: '10', page: '99' };
			const url = urlParams(page);

			await given('a link asking for the ninety-ninth page of ten', () =>
				expect(link.page).toBe('99')
			);
			await when('I open that link', () => issuesPage.goto(link));
			await then('the URL is rewritten to the last page', async () => {
				await expect
					.poll(() => url.get('page'), { timeout: 15_000 })
					.not.toBe('99');
				await issuesPage.table.expectOnLastPage();
			});
			await and('issues are listed', async () => {
				await issuesPage.expectReady();
				await expect
					.poll(() => issuesPage.table.rowCount(), { timeout: 15_000 })
					.toBeGreaterThan(0);
			});
		}
	);

	test(
		'Hiding a column records it and showing it again drops it',
		URL_TAG,
		async ({ page }) => {
			let issuesPage: IssuesPage;

			await given('the issues list is open', async () => {
				issuesPage = (await openRichestProject(page)).issuesPage;
				await issuesPage.table.expectHeaderShown('Key');
			});
			await when('I hide the Key column', () =>
				issuesPage.table.toggleColumn('Key')
			);
			await then('the URL records the Key column as hidden', () =>
				issuesPage.expectParams({ cols: '-key' })
			);
			await and('the Key column is gone', () =>
				issuesPage.table.expectHeaderHidden('Key')
			);
			await when('I reload the page', async () => {
				await page.reload();
				await issuesPage.expectReady();
			});
			await then('the Key column is still gone', () =>
				issuesPage.table.expectHeaderHidden('Key')
			);
			await when('I show the Key column', () =>
				issuesPage.table.toggleColumn('Key')
			);
			await then('the column override is dropped from the URL', async () => {
				await issuesPage.expectParams({ cols: null });
				await issuesPage.table.expectHeaderShown('Key');
			});
		}
	);

	test(
		'Reordering columns records the whole order',
		URL_TAG,
		async ({ page }) => {
			const url = urlParams(page);
			let issuesPage: IssuesPage;

			const issueBeforeKey = async () => {
				const labels = await issuesPage.table.headerLabels();

				return labels.indexOf('Issue') < labels.indexOf('Key');
			};

			await given('the issues list is open', async () => {
				issuesPage = (await openRichestProject(page)).issuesPage;
				await issuesPage.expectParams({ order: null });
				expect(await issueBeforeKey()).toBe(false);
			});
			await when('I drag the Issue column onto the Key column', () =>
				issuesPage.table.moveColumnOnto('Issue', 'Key')
			);
			await then('the URL records an order with Issue before Key', async () => {
				await url.expectWritten('order');
				const order = (url.get('order') ?? '').split(';');
				expect(order.indexOf('issue')).toBeLessThan(order.indexOf('key'));
				expect(order[0]).toBe('status');
				expect(order[order.length - 1]).toBe('actions');
			});
			await and('the Issue header comes before the Key header', () =>
				expect.poll(issueBeforeKey, { timeout: 15_000 }).toBe(true)
			);
			await when('I reload the page', async () => {
				await page.reload();
				await issuesPage.expectReady();
			});
			await then('the Issue header still comes before the Key header', () =>
				expect.poll(issueBeforeKey, { timeout: 15_000 }).toBe(true)
			);
		}
	);

	test(
		'An issues link restores the search, the facets, the sort and the columns',
		URL_TAG,
		async ({ page }) => {
			const issuesPage = new IssuesPage(page);
			const manifest = requireManifest();
			const project = richestProject(manifest);
			const issue = issueByState(manifest, 'open', project.projectId);
			const link = {
				project: String(project.projectId),
				q: issue.title,
				state: 'open',
				sort: 'issue:asc',
				pageSize: '10',
				cols: '-key'
			};

			await given(
				'a link that pins a search term, the open state, the Issue sort, a page size and a hidden column',
				() => expect(Object.keys(link)).toHaveLength(6)
			);
			await when('I open that link', async () => {
				await issuesPage.goto(link);
				await issuesPage.expectReady();
			});
			await then(
				'the list is narrowed, sorted and laid out as the link says',
				async () => {
					await expect(issuesPage.table.searchInput).toHaveValue(issue.title);
					await issuesPage.table.expectFacetSelected('State', 'Open');
					await issuesPage.table.expectRowListed(issue.issueId);
					await issuesPage.expectEveryRowInState('open');
					await issuesPage.table.expectSortedBy('Issue');
					await issuesPage.table.expectHeaderHidden('Key');
					await issuesPage.table.expectRowCountAtMost(10);
				}
			);
			await and(
				'the link still carries every parameter it was opened with',
				() => issuesPage.expectParams(link)
			);
		}
	);

	test(
		'Issues list controls preserve the project scope and the other parameters',
		URL_TAG,
		async ({ page }) => {
			let issuesPage: IssuesPage;
			let projectId = '';

			await given(
				'the issues list is open scoped to a project with closed issues shown',
				async () => {
					({ issuesPage, projectId } = await openRichestProject(page, {
						state: 'closed'
					}));
					await issuesPage.expectEveryRowInState('closed');
				}
			);
			await when('I search for a term', () => issuesPage.table.search('a'));
			await then('the project scope and the state are still pinned', () =>
				issuesPage.expectParams({ q: 'a', project: projectId, state: 'closed' })
			);
		}
	);

	test(
		"The sidebar's Issues link returns to the last issues list address",
		URL_TAG,
		async ({ page }) => {
			const sidebar = sidebarState(page);

			await given('the issues list is open with a state filter', async () => {
				const { issuesPage } = await openRichestProject(page, {
					state: 'closed'
				});
				await issuesPage.expectEveryRowInState('closed');
			});
			await when('I move to the dashboard', async () => {
				await page
					.getByRole('link', { name: 'Dashboard', exact: true })
					.click();
				await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
			});
			await then(
				'the compressed sidebar state remembers the filtered issues list',
				() =>
					sidebar.expectAliasCarries(
						SIDEBAR_ALIASES.issuesLastList,
						'state=closed'
					)
			);
		}
	);
});
