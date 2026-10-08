/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { expect, test } from './support/test';

import { ChatPage } from './pages/chat-page';
import { DashboardPage } from './pages/dashboard-page';
import { richestProject } from './support/classification-data';
import { and, given, then, when } from './support/gherkin';
import { requireManifest } from './support/manifest';
import { urlParams } from './support/url-params';

const URL_TAG = { tag: ['@chat', '@url-params'] };

test.describe('Assistant', () => {
	test(
		'Opening the assistant mints a thread address in place',
		URL_TAG,
		async ({ page }) => {
			const chatPage = new ChatPage(page);
			const dashboardPage = new DashboardPage(page);

			await given('I open the dashboard', () => dashboardPage.goto());
			await when('I open the assistant', () => chatPage.goto());
			await then('the address names a new thread', async () => {
				await chatPage.threadId();
				await chatPage.expectReady();
			});
			await when('I go back', () => page.goBack());
			await then('the dashboard is open again', () =>
				expect(page).toHaveURL(/\/dashboard(?:$|\?)/, { timeout: 15_000 })
			);
		}
	);

	test('A thread address survives a reload', URL_TAG, async ({ page }) => {
		const chatPage = new ChatPage(page);
		let threadId = '';

		await given('the assistant is open on a thread', async () => {
			await chatPage.goto();
			threadId = await chatPage.threadId();
			await chatPage.expectReady();
		});
		await when('I reload the page', () => page.reload());
		await then('the same thread is open', async () => {
			await chatPage.expectThread(threadId);
			await chatPage.expectReady();
		});
	});

	test(
		'New Chat starts another thread and Back returns to the previous one',
		URL_TAG,
		async ({ page }) => {
			const chatPage = new ChatPage(page);
			let threadId = '';

			await given('the assistant is open on a thread', async () => {
				await chatPage.goto();
				threadId = await chatPage.threadId();
				await chatPage.expectReady();
			});
			await when('I start a new chat', () => chatPage.startNewChat());
			await then('the address names a different thread', async () => {
				await expect
					.poll(() => chatPage.threadId(), { timeout: 15_000 })
					.not.toBe(threadId);
			});
			await when('I go back', () => page.goBack());
			await then('the previous thread is open again', () =>
				chatPage.expectThread(threadId)
			);
		}
	);

	test(
		'The project scope is carried into the minted thread address',
		{ tag: ['@chat', '@needs-classification', '@url-params'] },
		async ({ page }) => {
			const chatPage = new ChatPage(page);
			const projectId = String(richestProject(requireManifest()).projectId);
			const url = urlParams(page);

			await given('a link to the assistant scoped to a project', () =>
				expect(projectId).not.toBe('')
			);
			await when('I open that link', () =>
				chatPage.goto(undefined, `project=${projectId}`)
			);
			await then('the address names a new thread', async () => {
				await chatPage.threadId();
				await chatPage.expectReady();
			});
			await and('the link still carries the project', () =>
				url.expect({ project: projectId })
			);
		}
	);
});
