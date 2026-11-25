/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { DashboardAPIResponse } from '@/shared/types';

import { createColorMap } from './dashboard-table.component.utils';

const link = (value: string) => ({
	value,
	payload: { url: 'runs', params: '1' }
});

const headers: DashboardAPIResponse['header'] = [
	{ key: 'session', name: 'Session' },
	{ key: 'total', name: 'Total' },
	{ key: 'unexpected', name: 'NOK' },
	{ key: 'log', name: 'Log' }
];

const rows = [
	{
		row_cells: {
			session: link('s1'),
			total: link('10'),
			unexpected: link('3'),
			log: link('log')
		},
		context: { run_id: 1 }
	}
] as unknown as DashboardAPIResponse['rows'];

describe('createColorMap', () => {
	it('colours badge columns by their index', () => {
		const map = createColorMap(rows, headers);

		expect(headers.map(({ key }) => map.getColorByKey(key))).toEqual([
			'bg-badge-0',
			'bg-badge-1',
			'bg-badge-2',
			'bg-badge-3'
		]);
	});

	it('paints the go_run_failed column red and keeps the others in place', () => {
		const map = createColorMap(rows, headers, {
			session: 'Go to Run',
			total: 'Go to Log',
			unexpected: 'Go to Run (Preview NOK)',
			log: 'Go to Log'
		});

		expect(headers.map(({ key }) => map.getColorByKey(key))).toEqual([
			'bg-badge-0',
			'bg-badge-1',
			'bg-badge-5',
			'bg-badge-3'
		]);
	});
});
