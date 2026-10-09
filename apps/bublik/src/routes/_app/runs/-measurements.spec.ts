/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createMemoryHistory } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';

import { config } from '@/bublik/config';

import { createAppRouter } from '../../../router';

async function routerAt(url: string) {
	const router = createAppRouter(
		createMemoryHistory({ initialEntries: [`${config.baseUrl}${url}`] })
	);

	// Follows a redirect thrown in `beforeLoad` before resolving.
	await router.load();

	return router;
}

const PAGE = '/runs/1/results/2/measurements';

describe('the measurements route', () => {
	it('rewrites a legacy jsurl search to its legacy-codec form, replacing the entry', async () => {
		const router = await routerAt(`${PAGE}?mode=~'overlay#top`);

		expect(router.history.location.href).toBe(
			`${config.baseUrl}${PAGE}?mode=overlay`
		);
		expect(router.state.matches.at(-1)?.routeId).toBe(
			'/_app/runs/$runId/results/$resultId/measurements'
		);
		expect(router.history.length).toBe(1);
	});

	it('keeps the legacy codec bytes of the rewrite', async () => {
		// `encodeURIComponent`, not `URLSearchParams` (`a+%28x%29`).
		const router = await routerAt(`${PAGE}?mode=~'overlay&q=a%20(x)`);

		expect(router.history.location.href).toBe(
			`${config.baseUrl}${PAGE}?mode=overlay&q=a%20(x)`
		);
	});

	it('does not loop on a tilde the conversion keeps', async () => {
		const url = `${PAGE}?mode=overlay&q=a~b`;
		const router = await routerAt(url);

		expect(router.history.location.href).toBe(`${config.baseUrl}${url}`);
		expect(router.history.length).toBe(1);
	});

	it('leaves a current search alone', async () => {
		const url = `${PAGE}?mode=overlay&selectedCharts=2&selectedCharts=3#top`;
		const router = await routerAt(url);

		expect(router.history.location.href).toBe(`${config.baseUrl}${url}`);
		expect(router.history.length).toBe(1);
	});
});
