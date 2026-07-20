/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { ChatContextUsageSchema } from '@/services/bublik-api';

describe('ChatContextUsageSchema', () => {
	it('parses full context usage with all fields', () => {
		const parsed = ChatContextUsageSchema.parse({
			tokens: 1234,
			context_limit: 128000,
			provider: 'anthropic',
			model: 'claude',
			compacted: true,
			covered_count: 5,
			compacted_at: '2026-07-01T12:00:00'
		});
		expect(parsed.tokens).toBe(1234);
		expect(parsed.context_limit).toBe(128000);
		expect(parsed.compacted).toBe(true);
		expect(parsed.covered_count).toBe(5);
		expect(parsed.compacted_at).toBe('2026-07-01T12:00:00');
	});

	it('accepts minimal usage with just tokens', () => {
		const parsed = ChatContextUsageSchema.parse({ tokens: 500 });
		expect(parsed.tokens).toBe(500);
		expect(parsed.compacted).toBeUndefined();
		expect(parsed.context_limit).toBeUndefined();
	});

	it('accepts nullish optional fields', () => {
		const parsed = ChatContextUsageSchema.parse({
			tokens: 0,
			compacted: null,
			context_limit: null
		});
		expect(parsed.tokens).toBe(0);
		expect(parsed.compacted).toBeNull();
	});

	it('rejects missing tokens', () => {
		expect(() => ChatContextUsageSchema.parse({})).toThrow();
	});
});
