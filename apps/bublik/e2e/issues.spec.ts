/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { expect, test } from './support/test';
import type { APIRequestContext, Page } from '@playwright/test';

import { IssuesPage } from './pages/issues-page';
import { IssueCleanup } from './support/classification';
import { and, given, then, when } from './support/gherkin';
import { requireCapability } from './support/capabilities';
import { requireManifest } from './support/manifest';
import { projectIdByName } from './support/e2e-data';
import { classifiableRun } from './support/sample-cases';

const ISSUES = { tag: ['@issues'] };
const ISSUES_WRITE = { tag: ['@issues', '@issues-write'] };
const ISSUES_WRITE_URL = { tag: ['@issues', '@issues-write', '@url-params'] };

const cleanup = new IssueCleanup('issues');

/** The project the classifiable run belongs to — the one every issue here is recorded in. */
function fixtureProject() {
	return requireCapability(
		classifiableRun(requireManifest()),
		'Fixture manifest contains no second NOK run safe to classify.'
	).bundle.project;
}

async function fixtureProjectId(request: APIRequestContext): Promise<number> {
	const name = fixtureProject();

	return requireCapability(
		await projectIdByName(request, name),
		`Project "${name}" is not registered.`
	);
}

async function openForProject(
	page: Page,
	request: APIRequestContext
): Promise<{ issuesPage: IssuesPage; projectId: number }> {
	const issuesPage = new IssuesPage(page);
	const projectId = await fixtureProjectId(request);

	await issuesPage.goto({ project: String(projectId) });
	await issuesPage.expectLoaded();

	return { issuesPage, projectId };
}

async function recordIssue(
	issuesPage: IssuesPage,
	projectId: number,
	label: string,
	extra: { description?: string; tracker?: string; bugKey?: string } = {}
): Promise<{ title: string; issueId: number }> {
	const title = cleanup.title(label);
	const issueId = await issuesPage.createIssue({ title, ...extra });
	cleanup.register(issueId, projectId);

	return { title, issueId };
}

async function removeIssue(
	issuesPage: IssuesPage,
	title: string,
	issueId: number
): Promise<void> {
	await issuesPage.table.search(title);
	await issuesPage.deleteIssue(title);
	cleanup.forget(issueId);
}

test.describe('Issues Page', () => {
	test.afterEach(async ({ request }, testInfo) => {
		if (!testInfo.tags.includes('@issues-write')) return;

		await cleanup.sweep(request);
	});

	test(
		'The issues page lists issues in a project-grouped table',
		{ tag: ['@issues', '@smoke'] },
		async ({ page, request }) => {
			const issuesPage = new IssuesPage(page);
			const projectId = await fixtureProjectId(request);

			await when('I open the issues page for the fixture project', () =>
				issuesPage.goto({ project: String(projectId) })
			);
			await then('the issues table or its empty state is shown', () =>
				issuesPage.expectLoaded()
			);
			await and('the footer tells how many issues are listed', async () => {
				if (await issuesPage.emptyState.isVisible()) return;

				await issuesPage.table.expectFooterRange();
			});
		}
	);

	test(
		'A new issue is recorded from the New Issue drawer and removed again',
		ISSUES_WRITE,
		async ({ page, request }) => {
			let issuesPage!: IssuesPage;
			let projectId = 0;
			let title = '';

			await given(
				'I open the issues page for the fixture project',
				async () => {
					({ issuesPage, projectId } = await openForProject(page, request));
				}
			);
			await when('I record an issue with a unique title', async () => {
				({ title } = await recordIssue(issuesPage, projectId, 'record'));
			});
			await then(
				'the issue is listed as open with no rules and no results',
				async () => {
					await issuesPage.expectIssueState(title, 'open');
					await issuesPage.expectRulesBadge(title, 'unruled', 'No rules');
					await issuesPage.expectResultCount(title, 0);
				}
			);
			await when('I delete that issue from its row and confirm', () =>
				issuesPage.deleteIssue(title)
			);
			await then('the issue is no longer listed', () =>
				issuesPage.expectIssueGone(title)
			);
		}
	);

	test(
		'The New Issue drawer refuses an empty form',
		ISSUES,
		async ({ page }) => {
			const issuesPage = new IssuesPage(page);

			await given('I open the issues page for every project', async () => {
				await issuesPage.goto();
				await issuesPage.expectLoaded();
			});
			const drawer = await when(
				'I open the New Issue drawer and submit it empty',
				async () => {
					const opened = await issuesPage.openNewIssue();
					await opened.expectProjectFieldShown(true);
					await opened.submit();

					return opened;
				}
			);
			await then(
				'I am told to select a project and that a title is required',
				() => drawer.expectValidation('Select a project', 'Title is required')
			);
			await when('I cancel the drawer', () => drawer.cancel());
			await then('the drawer is closed', () => drawer.expectClosed());
		}
	);

	test(
		'The New Issue drawer checks the tracker and bug key halves',
		ISSUES,
		async ({ page, request }) => {
			const drawer = await given(
				'I open the New Issue drawer for the fixture project',
				async () => {
					const { issuesPage } = await openForProject(page, request);
					const opened = await issuesPage.openNewIssue();
					await opened.fill({ title: 'draft' });

					return opened;
				}
			);
			await when('I enter a tracker with a space in it', async () => {
				await drawer.fill({ tracker: 'a b' });
				await drawer.submit();
			});
			await then('I am told a tracker cannot contain spaces', () =>
				drawer.expectValidation('Tracker cannot contain spaces or "/"')
			);
			await when('I clear the tracker and enter only a bug key', async () => {
				await drawer.fill({ tracker: '', bugKey: 'KEY-1' });
				await drawer.submit();
			});
			await then('I am told to choose a tracker', () =>
				drawer.expectValidation('Choose a tracker')
			);
			await when('I enter a bug key with forbidden characters', async () => {
				await drawer.fill({ tracker: 'E2E', bugKey: 'bad key!' });
				await drawer.submit();
			});
			await then('I am told which characters a bug key may contain', () =>
				drawer.expectValidation(
					'Bug key can only contain letters, digits and - _ / :'
				)
			);
			await and('I cancel the drawer', () => drawer.cancel());
		}
	);

	test(
		'An issue with a bug key shows the key in its row',
		ISSUES_WRITE,
		async ({ page, request }) => {
			let issuesPage!: IssuesPage;
			let projectId = 0;
			let title = '';
			let issueId = 0;

			await given(
				'I open the issues page for the fixture project',
				async () => {
					({ issuesPage, projectId } = await openForProject(page, request));
				}
			);
			await when('I record an issue with a tracker and a bug key', async () => {
				({ title, issueId } = await recordIssue(issuesPage, projectId, 'key', {
					tracker: 'E2E',
					bugKey: 'E2E-1'
				}));
			});
			await then("the issue's row shows the key", () =>
				issuesPage.expectKey(title, 'E2E-1')
			);
			await and('I delete that issue', () =>
				removeIssue(issuesPage, title, issueId)
			);
		}
	);

	test(
		'Editing an issue from the list renames it',
		ISSUES_WRITE,
		async ({ page, request }) => {
			let issuesPage!: IssuesPage;
			let projectId = 0;
			let title = '';
			let issueId = 0;
			let renamed = '';

			await given(
				'I open the issues page for the fixture project',
				async () => {
					({ issuesPage, projectId } = await openForProject(page, request));
				}
			);
			await and('I record an issue with a unique title', async () => {
				({ title, issueId } = await recordIssue(issuesPage, projectId, 'edit'));
			});
			await when(
				'I edit the issue from its row and save it under a new title',
				async () => {
					renamed = `${title} renamed`;
					const drawer = await issuesPage.openEdit(
						issuesPage.rowByTitle(title)
					);
					await drawer.expectTitle(title);
					await drawer.expectStateFieldShown(true);
					await drawer.fill({ title: renamed });
					await drawer.submit();
					await drawer.expectClosed();
				}
			);
			await then('the issue is listed under the new title', async () => {
				await issuesPage.table.search(renamed);
				await issuesPage.expectIssueListed(renamed);
			});
			await and('I delete that issue', () =>
				removeIssue(issuesPage, renamed, issueId)
			);
		}
	);

	test(
		'Cancelling the delete confirmation keeps the issue',
		ISSUES_WRITE,
		async ({ page, request }) => {
			let issuesPage!: IssuesPage;
			let projectId = 0;
			let title = '';
			let issueId = 0;

			await given(
				'I open the issues page for the fixture project',
				async () => {
					({ issuesPage, projectId } = await openForProject(page, request));
				}
			);
			await and('I record an issue with a unique title', async () => {
				({ title, issueId } = await recordIssue(
					issuesPage,
					projectId,
					'cancel'
				));
			});
			await when(
				'I ask to delete the issue but cancel the confirmation',
				async () => {
					await issuesPage.requestDelete(issuesPage.rowByTitle(title));
					const dialog = page.getByRole('alertdialog');
					await expect(dialog).toBeVisible({ timeout: 15_000 });
					await dialog.getByRole('button', { name: 'Cancel' }).click();
					await expect(dialog).toBeHidden({ timeout: 15_000 });
				}
			);
			await then('the issue is still listed', () =>
				issuesPage.expectIssueListed(title)
			);
			await and('I delete that issue', () =>
				removeIssue(issuesPage, title, issueId)
			);
		}
	);

	test(
		'Searching issues writes q and returns to the first page',
		ISSUES_WRITE_URL,
		async ({ page, request }) => {
			let issuesPage!: IssuesPage;
			let projectId = 0;
			let title = '';
			let issueId = 0;

			await given(
				'I open the issues page for the fixture project',
				async () => {
					({ issuesPage, projectId } = await openForProject(page, request));
				}
			);
			await and('I record an issue with a unique title', async () => {
				({ title, issueId } = await recordIssue(
					issuesPage,
					projectId,
					'search'
				));
			});
			await when('I search for that title', () =>
				issuesPage.table.search(title)
			);
			await then(
				'the search is written to the URL and the page is the first',
				() => issuesPage.expectParams({ q: title, page: null })
			);
			await and('only that issue is listed', async () => {
				await issuesPage.expectIssueListed(title);
				await expect(issuesPage.rows()).toHaveCount(1);
			});
			await when('I search for text no issue carries', () =>
				issuesPage.table.search(`${title} nothing-carries-this`)
			);
			await then('no matching issues are shown', () =>
				issuesPage.table.expectNoMatching()
			);
			await when('I reset the filters', () => issuesPage.table.reset());
			await then('the search is cleared from the URL', () =>
				issuesPage.expectParams({ q: null })
			);
			await and('the reset button is disabled', () =>
				issuesPage.table.expectResetDisabled()
			);
			await and('I delete that issue', () =>
				removeIssue(issuesPage, title, issueId)
			);
		}
	);

	test(
		'The State filter and the state badge write state to the URL',
		ISSUES_WRITE_URL,
		async ({ page, request }) => {
			let issuesPage!: IssuesPage;
			let projectId = 0;
			let title = '';
			let issueId = 0;

			await given(
				'I open the issues page for the fixture project',
				async () => {
					({ issuesPage, projectId } = await openForProject(page, request));
				}
			);
			await and('I record an issue with a unique title', async () => {
				({ title, issueId } = await recordIssue(
					issuesPage,
					projectId,
					'state'
				));
			});
			await and('I search for that title', () =>
				issuesPage.table.search(title)
			);
			await when('I pick the open state in the State filter', () =>
				issuesPage.table.toggleFacet('State', 'Open')
			);
			await then(
				'the state is written to the URL and the issue is still listed',
				async () => {
					await issuesPage.expectParams({ state: 'open' });
					await issuesPage.table.expectFacetReports('State', 'Open');
					await issuesPage.expectIssueListed(title);
				}
			);
			await when('I reset the filters', () => issuesPage.table.reset());
			await then('the state is cleared from the URL', async () => {
				await issuesPage.expectParams({ state: null });
				await issuesPage.table.search(title);
				await issuesPage.expectIssueListed(title);
			});
			await when("I click the issue's state badge", () =>
				issuesPage.stateBadge(issuesPage.rowByTitle(title)).click()
			);
			await then('the state is written to the URL again', () =>
				issuesPage.expectParams({ state: 'open' })
			);
			await and('I delete that issue', () =>
				removeIssue(issuesPage, title, issueId)
			);
		}
	);

	test(
		'The Rules filter singles out unruled issues',
		ISSUES_WRITE_URL,
		async ({ page, request }) => {
			let issuesPage!: IssuesPage;
			let projectId = 0;
			let title = '';
			let issueId = 0;

			await given(
				'I open the issues page for the fixture project',
				async () => {
					({ issuesPage, projectId } = await openForProject(page, request));
				}
			);
			await and('I record an issue with a unique title', async () => {
				({ title, issueId } = await recordIssue(
					issuesPage,
					projectId,
					'rules'
				));
			});
			await and('I search for that title', () =>
				issuesPage.table.search(title)
			);
			await when('I pick issues without rules in the Rules filter', () =>
				issuesPage.table.toggleFacet('Rules', 'No rules')
			);
			await then(
				'the rules state is written to the URL and the issue is still listed',
				async () => {
					await issuesPage.expectParams({ rules: 'unruled' });
					await issuesPage.expectIssueListed(title);
				}
			);
			await when("I click the issue's rules badge", () =>
				issuesPage.rulesBadge(issuesPage.rowByTitle(title)).click()
			);
			await then('the rules state is cleared from the URL', () =>
				issuesPage.expectParams({ rules: null })
			);
			await and('I delete that issue', () =>
				removeIssue(issuesPage, title, issueId)
			);
		}
	);

	test(
		'Showing the Created column and sorting by Issue are written to the URL',
		{ tag: ['@issues', '@issues-write', '@url-params'] },
		async ({ page, request }) => {
			let issuesPage!: IssuesPage;
			let title = '';
			let issueId = 0;

			await given(
				'I open the issues page for the fixture project with issues listed',
				async () => {
					const opened = await openForProject(page, request);
					issuesPage = opened.issuesPage;
					({ title, issueId } = await recordIssue(
						issuesPage,
						opened.projectId,
						'created'
					));
					await issuesPage.table.expectColumnHidden('Created');
				}
			);
			await when('I turn the Created column on', () =>
				issuesPage.table.toggleColumn('Created')
			);
			await then(
				'the Created column is shown and the columns are written to the URL',
				async () => {
					await issuesPage.table.expectColumnShown('Created');
					await issuesPage.expectParamContains('cols', '+created');
				}
			);
			// Created is the default sort, so its first click only clears it; the
			// Issue column starts unsorted and goes straight to ascending.
			await when('I sort by the Issue column', () =>
				issuesPage.table.sortBy('Issue')
			);
			await then('the sort is written to the URL', () =>
				issuesPage.expectParams({ sort: 'issue:asc' })
			);
			await and('I delete that issue', async () => {
				await issuesPage.table.toggleColumn('Created');
				await removeIssue(issuesPage, title, issueId);
			});
		}
	);

	test(
		'The rows-per-page choice is written to the URL',
		{ tag: ['@issues', '@issues-write', '@url-params'] },
		async ({ page, request }) => {
			let issuesPage!: IssuesPage;
			let title = '';
			let issueId = 0;

			await given(
				'I open the issues page for the fixture project with issues listed',
				async () => {
					const opened = await openForProject(page, request);
					issuesPage = opened.issuesPage;
					({ title, issueId } = await recordIssue(
						issuesPage,
						opened.projectId,
						'rows'
					));
					await issuesPage.table.clearSearch();
					await issuesPage.expectParams({ q: null });
				}
			);
			await when('I choose ten rows per page', () =>
				issuesPage.table.setRowsPerPage(10)
			);
			await then('the page size is written to the URL', async () => {
				await issuesPage.expectParams({ pageSize: '10', page: null });
				await issuesPage.table.expectFooterRange();
			});
			await and('I delete that issue', () =>
				removeIssue(issuesPage, title, issueId)
			);
		}
	);

	test(
		'Collapsing a project group hides its rows',
		{ tag: ['@issues', '@issues-write', '@url-params'] },
		async ({ page, request }) => {
			let issuesPage!: IssuesPage;
			let projectId = 0;
			let title = '';
			let issueId = 0;

			await given(
				'I open the issues page for the fixture project with issues listed',
				async () => {
					({ issuesPage, projectId } = await openForProject(page, request));
					({ title, issueId } = await recordIssue(
						issuesPage,
						projectId,
						'group'
					));
					await issuesPage.table.expectGroupExpanded(projectId, true);
				}
			);
			await when("I collapse the project's group", () =>
				issuesPage.table.collapseGroup(projectId)
			);
			await then('the group is folded and its rows are hidden', async () => {
				await issuesPage.table.expectGroupExpanded(projectId, false);
				await issuesPage.expectIssueGone(title);
			});
			await when('I expand the group again', () =>
				issuesPage.table.expandGroup(projectId)
			);
			await then('the issue is listed again', () =>
				issuesPage.expectIssueListed(title)
			);
			await and('I delete that issue', () =>
				removeIssue(issuesPage, title, issueId)
			);
		}
	);

	test(
		'A long description opens in a popover',
		ISSUES_WRITE,
		async ({ page, request }) => {
			let issuesPage!: IssuesPage;
			let projectId = 0;
			let title = '';
			let issueId = 0;
			const description =
				`The driver reports the link up but the mode request is never acknowledged. ${'Repeats on every run since the driver bump. '.repeat(
					8
				)}`.trim();

			await given(
				'I open the issues page for the fixture project',
				async () => {
					({ issuesPage, projectId } = await openForProject(page, request));
				}
			);
			await when('I record an issue with a long description', async () => {
				({ title, issueId } = await recordIssue(
					issuesPage,
					projectId,
					'description',
					{ description }
				));
			});
			await then(
				'its description cell opens the full text in a popover',
				async () => {
					await issuesPage.table.openDescription(issuesPage.rowByTitle(title));
					await expect(
						issuesPage.table.descriptionPopover.getByRole('heading', {
							name: title
						})
					).toBeVisible();
					await expect(
						issuesPage.table.descriptionPopover.getByTestId(
							'description-popover-body'
						)
					).toContainText('Repeats on every run since the driver bump.');
					await page.keyboard.press('Escape');
					await expect(issuesPage.table.descriptionPopover).toBeHidden();
				}
			);
			await and('I delete that issue', () =>
				removeIssue(issuesPage, title, issueId)
			);
		}
	);
});

test.describe('Issues Page (signed out)', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test(
		'Creating issues while signed out asks me to sign in',
		{ tag: ['@issues', '@auth'] },
		async ({ page }) => {
			const issuesPage = new IssuesPage(page);
			const dialog = page.getByTestId('login-dialog');
			const sessionChecked = page.waitForResponse(
				(response) =>
					response.url().includes('/auth/profile/info/') &&
					response.status() === 403
			);
			const loginRequiredAction = issuesPage.loginRequiredAction(
				'Log in to create issues'
			);

			await given('I am signed out and open the issues page', async () => {
				await issuesPage.goto();
				await sessionChecked;
				await issuesPage.expectLoaded();
			});
			await then('the New Issue action is disabled with a hint to log in', () =>
				expect(loginRequiredAction.first()).toHaveText(/New Issue/, {
					timeout: 30_000
				})
			);
			await when('I click it anyway', () =>
				loginRequiredAction.first().click()
			);
			await then('I am asked to sign in to create issues', async () => {
				await expect(dialog.getByText('Log in to create issues.')).toBeVisible({
					timeout: 15_000
				});
				await expect(
					dialog.getByRole('button', { name: 'Sign in' })
				).toBeVisible();
			});
			await when('I click outside the sign-in dialog', () =>
				page.mouse.click(5, 5)
			);
			await then('the sign-in dialog closes', () =>
				expect(dialog).toHaveCount(0, { timeout: 15_000 })
			);
			await and('I am still on the issues page', () =>
				expect(page).toHaveURL(/\/issues(?:$|\?)/)
			);
		}
	);
});
