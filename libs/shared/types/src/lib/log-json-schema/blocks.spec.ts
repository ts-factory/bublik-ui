/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, test } from 'vitest';

import { RootBlockSchema, type LogJsonTimestamp } from './blocks';

const createRootBlock = (timestamp: LogJsonTimestamp) => ({
	version: 'v1',
	root: [
		{
			type: 'te-log',
			content: [
				{
					type: 'te-log-table',
					data: [
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
				}
			]
		}
	]
});

describe('RootBlockSchema log table timestamps', () => {
	test('accepts legacy formatted timestamp values', () => {
		const result = RootBlockSchema.safeParse(
			createRootBlock({
				timestamp: 1711228617.029961,
				formatted: '21:16:57.029'
			})
		);

		expect(result.success).toBe(true);
	});

	test('accepts top-level timestamp values', () => {
		const result = RootBlockSchema.safeParse(
			createRootBlock(1711228617.029961)
		);

		expect(result.success).toBe(true);
	});

	test('rejects legacy timestamp objects without formatted values', () => {
		const result = RootBlockSchema.safeParse(
			createRootBlock({ timestamp: 1711228617.029961 } as LogJsonTimestamp)
		);

		expect(result.success).toBe(false);
	});
});
