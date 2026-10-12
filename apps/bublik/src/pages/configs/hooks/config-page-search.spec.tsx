/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderHookWithRouter } from '@/router/testing';

import { configSearch } from '../../../routes/-search/config.search';
import { useConfigPageSearchParams } from './index';

const NEW_CONFIG = '%7B%22type%22%3A%22report%22%2C%22name%22%3A%22x%22%7D';

function renderAt(search: string, state?: Record<string, unknown>) {
	return renderHookWithRouter(useConfigPageSearchParams, {
		path: '/admin/config',
		search,
		state,
		route: { id: '/_app/admin/config', search: configSearch }
	});
}

describe('useConfigPageSearchParams: reads', () => {
	it('reads configId as a number', async () => {
		const { result } = await renderAt('?configId=11');

		expect(result.current.configId).toBe(11);
	});

	it('reads a configId that is not a number as absent', async () => {
		const { result } = await renderAt('?configId=abc');

		expect(result.current.configId).toBeUndefined();
	});

	it('reads new_config through its schema, unknown keys stripped', async () => {
		const { result } = await renderAt(
			`?new_config=${encodeURIComponent(
				JSON.stringify({ type: 'report', name: 'x', extra: 1 })
			)}`
		);

		expect(result.current.newConfigParams).toEqual({
			type: 'report',
			name: 'x'
		});
	});

	it.each([
		['absent', ''],
		['not JSON', `?new_config=${encodeURIComponent('{not-json')}`],
		[
			'rejected by the schema',
			`?new_config=${encodeURIComponent('{"type":5}')}`
		]
	])(
		'falls back to global per_conf when new_config is %s',
		async (_, search) => {
			const { result } = await renderAt(search);

			expect(result.current.newConfigParams).toEqual({
				type: 'global',
				name: 'per_conf'
			});
		}
	);
});

describe('useConfigPageSearchParams: writes (replaceIn)', () => {
	it('setConfigId drops new_config and sets configId in one replace', async () => {
		const { router, result } = await renderAt(
			`?new_config=${NEW_CONFIG}&_s=abc`,
			{
				fromRun: true
			}
		);
		const length = router.history.length;

		await act(async () => result.current.setConfigId(5));

		expect(router.history.location.href).toBe(
			'/v2/admin/config?_s=abc&configId=5'
		);
		expect(router.history.length).toBe(length);
		expect(router.history.location.state).toMatchObject({ fromRun: true });
	});

	it('setConfigId keeps configId where it was', async () => {
		const { router, result } = await renderAt('?configId=3&_s=abc');

		await act(async () => result.current.setConfigId(5));

		expect(router.history.location.href).toBe(
			'/v2/admin/config?configId=5&_s=abc'
		);
	});

	it('setConfigId(null) removes configId', async () => {
		const { router, result } = await renderAt('?configId=3&_s=abc');

		await act(async () => result.current.setConfigId(null));

		expect(router.history.location.href).toBe('/v2/admin/config?_s=abc');
	});

	it('openNewConfig drops configId and replaces new_config in place', async () => {
		const { router, result } = await renderAt(
			`?new_config=${encodeURIComponent('{"type":"global"}')}&configId=3&_s=abc`
		);
		const length = router.history.length;

		await act(async () =>
			result.current.openNewConfig({ type: 'report', name: 'x' })
		);

		expect(router.history.location.href).toBe(
			`/v2/admin/config?new_config=${NEW_CONFIG}&_s=abc`
		);
		expect(router.history.length).toBe(length);
	});

	it('openNewConfig appends new_config when it was absent', async () => {
		const { router, result } = await renderAt('?configId=3&_s=abc');

		await act(async () =>
			result.current.openNewConfig({ type: 'report', name: 'x' })
		);

		expect(router.history.location.href).toBe(
			`/v2/admin/config?_s=abc&new_config=${NEW_CONFIG}`
		);
	});

	it('openNewConfig keeps a malformed new_config out of the result', async () => {
		const { router, result } = await renderAt(
			`?new_config=${encodeURIComponent('{not-json')}`
		);

		await act(async () =>
			result.current.openNewConfig({ type: 'report', name: 'x' })
		);

		expect(router.history.location.href).toBe(
			`/v2/admin/config?new_config=${NEW_CONFIG}`
		);
	});
});
