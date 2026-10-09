/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { renderHookWithRouter } from '@/router/testing';

import { useRunsSelectionUrls } from './runs-links';

async function urlsFor(selectedRunIds: string[]) {
	const { result } = await renderHookWithRouter(
		() => useRunsSelectionUrls(selectedRunIds),
		{ path: '/runs', search: 'mode=table&_s=abc&project=1' }
	);

	return result.current;
}

describe('useRunsSelectionUrls', () => {
	it('offers nothing for fewer than two runs', async () => {
		expect(await urlsFor([])).toEqual({ compareUrl: null, multipleUrl: null });
		expect(await urlsFor(['1'])).toEqual({
			compareUrl: null,
			multipleUrl: null
		});
	});

	it('compares a pair as left and right and repeats runIds, basepath-free', async () => {
		expect(await urlsFor(['1132', '1151'])).toEqual({
			compareUrl: '/compare?left=1132&right=1151',
			multipleUrl: '/multiple?runIds=1132&runIds=1151'
		});
	});

	it('only opens three runs or more in the multiple view, in selection order', async () => {
		expect(await urlsFor(['3', '1', '2'])).toEqual({
			compareUrl: null,
			multipleUrl: '/multiple?runIds=3&runIds=1&runIds=2'
		});
	});
});
