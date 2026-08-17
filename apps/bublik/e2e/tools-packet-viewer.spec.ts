/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* Implements apps/bublik/e2e/features/tools-packet-viewer.feature */
import { expect, test } from '@playwright/test';

import { and, then, when } from './support/gherkin';

test.describe('Packet Viewer Page', () => {
	test('Opening the packet viewer without a capture explains what is required', async ({
		page
	}) => {
		await when('I open the packet viewer without parameters', () =>
			page.goto('tools/packet-viewer')
		);
		await then('it reports invalid URL parameters', () =>
			expect(page.getByText('Invalid URL Parameters')).toBeVisible({
				timeout: 15_000
			})
		);
		await and('it offers to show the validation errors', () =>
			expect(page.getByText('Show validation errors')).toBeVisible({
				timeout: 15_000
			})
		);
	});

	test('A capture URL that is not a URL is rejected', async ({ page }) => {
		await when(
			'I open the packet viewer with a capture reference that is not a URL',
			() => page.goto('tools/packet-viewer?fileUrl=not-a-url')
		);
		await then('it reports invalid URL parameters', () =>
			expect(page.getByText('Invalid URL Parameters')).toBeVisible({
				timeout: 15_000
			})
		);
	});
});
