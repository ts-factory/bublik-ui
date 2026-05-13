/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, test } from 'vitest';

import { formatUnixTimestampToTimezone } from '@/shared/utils';

import {
	getFormattedMarkdown,
	type NewBugButtonProps
} from './new-bug.component';

const baseProps: NewBugButtonProps = {
	link: 'https://example.test/run/1',
	name: 'sample-test',
	tags: {
		branches: [],
		important: [],
		specialCategories: {}
	}
};

describe('getFormattedMarkdown', () => {
	test('formats log rows with top-level timestamp values', () => {
		const timestamp = 1711228667.618432;
		const markdown = getFormattedMarkdown({
			...baseProps,
			globalFilter: ['entity:user'],
			logs: [
				{
					line_number: 1,
					level: 'INFO',
					entity_name: 'entity',
					user_name: 'user',
					timestamp,
					log_content: [
						{
							type: 'te-log-table-content-text',
							content: 'message'
						}
					]
				}
			]
		});

		expect(markdown).toContain(formatUnixTimestampToTimezone(timestamp));
		expect(markdown).toContain('message');
	});
});
