/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

const THREAD_ID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const THREAD_ADDRESS = /\/chat\/([0-9a-f-]{36})(?:$|[?#])/i;

/**
 * The assistant page. It has no query parameters of its own: the thread is
 * the address, and a bare `/chat` is turned into one the moment it opens.
 */
class ChatPage {
	constructor(private readonly page: Page) {}

	async goto(threadId?: string, search = ''): Promise<void> {
		const path = threadId ? `chat/${threadId}` : 'chat';

		await this.page.goto(`${path}${search ? `?${search}` : ''}`);
		await expect(this.page).toHaveURL(/\/chat(?:$|[/?#])/);
	}

	get newChatButton(): Locator {
		return this.page.getByRole('button', { name: 'New Chat' });
	}

	get threadsHeading(): Locator {
		return this.page.getByText('Threads', { exact: true });
	}

	async expectReady(): Promise<void> {
		await expect(this.threadsHeading).toBeVisible({ timeout: 30_000 });
		await expect(this.newChatButton).toBeVisible({ timeout: 30_000 });
	}

	/** The thread id the address carries, once it carries one. */
	async threadId(): Promise<string> {
		await expect(this.page).toHaveURL(THREAD_ADDRESS, { timeout: 15_000 });

		const match = new URL(this.page.url()).pathname.match(THREAD_ADDRESS);
		const threadId = match?.[1] ?? '';

		expect(threadId).toMatch(THREAD_ID_PATTERN);

		return threadId;
	}

	async expectThread(threadId: string): Promise<void> {
		await expect(this.page).toHaveURL(
			new RegExp(`/chat/${threadId}(?:$|[?#])`),
			{ timeout: 15_000 }
		);
	}

	async startNewChat(): Promise<void> {
		await this.newChatButton.click();
	}
}

export { ChatPage };
