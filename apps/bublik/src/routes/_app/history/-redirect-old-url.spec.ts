/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createMemoryHistory } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';

import { config } from '@/bublik/config';

import { createAppRouter } from '../../../router';
import { inertRouterContext } from '../../../test/inert-router-context';

async function routerAt(url: string) {
	const history = createMemoryHistory({
		initialEntries: ['/v2/dashboard', `${config.baseUrl}${url}`],
		initialIndex: 1
	});
	const router = createAppRouter(history, inertRouterContext);

	// Follows a redirect thrown in `beforeLoad` before resolving.
	await router.load();

	return { router, history };
}

describe('the history routes redirect an old jsurl link', () => {
	it.each(['/history', '/history/v2'])(
		'%s: to the same query in the current format, replacing the entry and dropping the hash',
		async (pathname) => {
			const { router, history } = await routerAt(
				`${pathname}?testName=~'suite*2fsmoke*20case&pageSize=~25&mode=~'aggregation#top`
			);

			expect(router.history.location.href).toBe(
				`${config.baseUrl}${pathname}?testName=suite%2Fsmoke%20case&pageSize=25&mode=aggregation`
			);
			expect(history.length).toBe(2);
			expect(router.state.location.search).toMatchObject({
				testName: 'suite/smoke case',
				pageSize: '25',
				mode: 'aggregation'
			});
		}
	);

	it('converts a jsurl list to the base64 JSON the legacy codec writes', async () => {
		const { router } = await routerAt('/history?runIds=~(~1~2)');

		expect(router.history.location.href).toBe(
			`${config.baseUrl}/history?runIds=${encodeURIComponent(btoa('[1,2]'))}`
		);
	});

	it('leaves a current link alone', async () => {
		const url = '/history?testName=a+b&labels=&mode=linear';
		const { router } = await routerAt(url);

		expect(router.history.location.href).toBe(`${config.baseUrl}${url}`);
	});

	it('rewrites an encoded tilde once and then stops', async () => {
		const { router, history } = await routerAt(
			'/history?testName=a%7Eb&mode=linear'
		);

		expect(router.history.location.href).toBe(
			`${config.baseUrl}/history?testName=a~b&mode=linear`
		);
		expect(history.length).toBe(2);
	});

	it('does not loop on a tilde the conversion keeps', async () => {
		const url = '/history?testName=a~b&mode=linear';
		const { router } = await routerAt(url);

		expect(router.history.location.href).toBe(`${config.baseUrl}${url}`);
	});
});
