/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, test } from './support/test';

import { and, given, then, when } from './support/gherkin';
import { requireManifest } from './support/manifest';
import { importedRunId } from './support/e2e-data';
import { representativeRun } from './support/sample-cases';
import { urlParams } from './support/url-params';

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

	test(
		'A packet viewer link carrying a capture, a run and a result is accepted',
		{ tag: ['@url-params'] },
		async ({ page }) => {
			const url = urlParams(page);
			const { bundle } = representativeRun(requireManifest());
			const link = {
				fileUrl: bundle.importUrl,
				runId: String(importedRunId(bundle)),
				resultId: '1'
			};

			await given(
				'a link that names a capture URL, a run id and a result id',
				() => expect(() => new URL(link.fileUrl)).not.toThrow()
			);
			await when('I open that link', () =>
				page.goto(`tools/packet-viewer?${new URLSearchParams(link)}`)
			);
			await then('the invalid parameters panel is not shown', () =>
				expect(page.getByText('Invalid URL Parameters')).toHaveCount(0, {
					timeout: 15_000
				})
			);
			await and('the link still carries all three parameters', () =>
				url.expect(link)
			);
		}
	);

	test(
		'A packet viewer link whose run id is not a number is rejected',
		{ tag: ['@url-params'] },
		async ({ page }) => {
			await when(
				'I open the packet viewer with a run reference that is not a number',
				() =>
					page.goto(
						'tools/packet-viewer?fileUrl=https://example.com/capture.pcap&runId=not-a-number'
					)
			);
			await then('it reports invalid URL parameters', () =>
				expect(page.getByText('Invalid URL Parameters')).toBeVisible({
					timeout: 15_000
				})
			);
		}
	);
});
