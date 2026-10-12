/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import '../history-state';
import { hrefOf, renderHookAt, write } from '../../test/memory-router';
import { useSearchWriter } from './use-search-writer';

describe('useSearchWriter', () => {
	it('merges the keys into the current search and replaces the entry', async () => {
		const { router, result } = await renderHookAt(
			'/runs?page=2&_s=abc',
			useSearchWriter
		);

		await write(() => result.current({ 'settings-tab': 'beta' }));

		expect(hrefOf(router)).toBe('/v2/runs?page=2&_s=abc&settings-tab=beta');
		expect(router.history.length).toBe(1);
	});

	it('writes typed values through the route codecs', async () => {
		const { router, result } = await renderHookAt('/runs', useSearchWriter);

		await write(() => result.current({ 'settings-open': true, page: 3 }));
		expect(hrefOf(router)).toBe('/v2/runs?settings-open=1&page=3');

		await write(() => result.current({ 'settings-open': false }));
		expect(hrefOf(router)).toBe('/v2/runs?settings-open=0&page=3');
	});

	it('removes a key written as undefined', async () => {
		const { router, result } = await renderHookAt(
			'/runs?page=2&mode=charts',
			useSearchWriter
		);

		await write(() => result.current({ page: undefined }));

		expect(hrefOf(router)).toBe('/v2/runs?mode=charts');
	});

	it('coalesces writes made in one handler into one entry, in write order', async () => {
		const { router, result } = await renderHookAt(
			['/dashboard', '/runs?page=2'],
			useSearchWriter
		);

		await write(() => {
			result.current({ 'settings-tab': 'account' });
			result.current({ 'settings-open': true });
		});

		expect(hrefOf(router)).toBe(
			'/v2/runs?page=2&settings-tab=account&settings-open=1'
		);
		expect(router.history.length).toBe(2);
	});

	it('keeps location.state and drops the hash, as use-query-params did', async () => {
		const { router, result } = await renderHookAt('/runs', useSearchWriter);

		await write(() => {
			void router.navigate({
				to: '/runs',
				hash: 'top',
				state: { fromRun: true }
			});
		});
		await write(() => result.current({ page: 2 }));

		expect(hrefOf(router)).toBe('/v2/runs?page=2');
		expect(router.history.location.state).toMatchObject({ fromRun: true });
	});

	it('keeps the hash with { keepHash: true } and makes the search whole with { merge: false }', async () => {
		const { router, result } = await renderHookAt('/runs', useSearchWriter);

		await write(() => {
			void router.navigate({ to: '/runs', search: { page: '2' }, hash: 'top' });
		});
		await write(() =>
			result.current({ mode: 'charts' }, { keepHash: true, merge: false })
		);

		expect(hrefOf(router)).toBe('/v2/runs?mode=charts#top');
	});

	it('pushes with { replace: false }', async () => {
		const { router, result } = await renderHookAt('/runs', useSearchWriter);

		await write(() => result.current({ page: 2 }, { replace: false }));

		expect(router.history.length).toBe(2);
	});

	it('hands a functional update the search the router is at right now', async () => {
		const { router, result } = await renderHookAt(
			'/runs?page=2',
			useSearchWriter
		);

		await write(() => {
			result.current({ mode: 'charts' });
			result.current((latest) => ({
				page: `${latest.page}0`,
				mode: undefined
			}));
		});

		expect(hrefOf(router)).toBe('/v2/runs?page=20');
	});

	it('drops location.state with { keepState: false } and still navigates when nothing changes', async () => {
		const { router, result } = await renderHookAt('/runs', useSearchWriter);

		await write(() => {
			void router.navigate({
				to: '/runs',
				search: { page: '2' },
				state: { fromRun: true }
			});
		});
		const before = router.history.location.state.__TSR_key;

		await write(() =>
			result.current({ page: '2' }, { keepState: false, replace: false })
		);

		expect(hrefOf(router)).toBe('/v2/runs?page=2');
		expect(router.history.location.state).not.toHaveProperty('fromRun');
		expect(router.history.location.state.__TSR_key).not.toBe(before);
		expect(router.history.length).toBe(3);
	});

	it('does not navigate when the search would not change', async () => {
		const { router, result } = await renderHookAt(
			'/runs?page=2',
			useSearchWriter
		);
		const before = router.history.location.state.__TSR_key;

		await write(() => result.current({ page: 2 }));

		expect(router.history.location.state.__TSR_key).toBe(before);
	});
});
