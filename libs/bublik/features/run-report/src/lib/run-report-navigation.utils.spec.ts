/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { TestBlock } from '@/shared/types';

import {
	getArgsValNavigationTarget,
	getCurrentArgsValNavigationItem,
	getVisibleArgsValNavigationItems
} from './run-report-navigation.utils';

function createTestBlock(
	id: string,
	argsValBlocks: Array<{ id: string; label: string }>
): TestBlock {
	return {
		type: 'test-block',
		id,
		label: id,
		enable_table_view: true,
		enable_chart_view: true,
		common_args: {},
		content: argsValBlocks.map((block) => ({
			type: 'arg-val-block',
			id: block.id,
			label: block.label,
			args_vals: {},
			content: []
		}))
	};
}

describe('run report arg-val navigation', () => {
	it('returns visible arg-val blocks in report order', () => {
		const items = getVisibleArgsValNavigationItems([
			createTestBlock('test-1', [
				{ id: 'arg-1', label: 'Arg 1' },
				{ id: 'empty', label: '' }
			]),
			createTestBlock('test-2', [{ id: 'arg-2', label: 'Arg 2' }])
		]);

		expect(items).toEqual([
			{ id: 'arg-1', label: 'Arg 1' },
			{ id: 'arg-2', label: 'Arg 2' }
		]);
	});

	it('resolves previous and next targets with boundary no-ops', () => {
		const items = [
			{ id: 'arg-1', label: 'Arg 1' },
			{ id: 'arg-2', label: 'Arg 2' },
			{ id: 'arg-3', label: 'Arg 3' }
		];

		expect(getArgsValNavigationTarget(items, 'arg-2', 'previous')).toEqual(
			items[0]
		);
		expect(getArgsValNavigationTarget(items, 'arg-2', 'next')).toEqual(
			items[2]
		);
		expect(getArgsValNavigationTarget(items, 'arg-1', 'previous')).toBe(
			undefined
		);
		expect(getArgsValNavigationTarget(items, 'arg-3', 'next')).toBe(undefined);
		expect(getArgsValNavigationTarget(items, 'missing', 'next')).toBe(
			undefined
		);
	});

	it('finds the active item from the page-container scroll position', () => {
		const scroller = document.createElement('div');
		const first = document.createElement('div');
		const second = document.createElement('div');

		scroller.scrollTop = 150;
		scroller.getBoundingClientRect = vi.fn(() => ({ top: 0 } as DOMRect));
		first.id = encodeURIComponent('arg-1');
		second.id = encodeURIComponent('arg-2');
		second.dataset.offset = '10';
		first.getBoundingClientRect = vi.fn(() => ({ top: -60 } as DOMRect));
		second.getBoundingClientRect = vi.fn(() => ({ top: 5 } as DOMRect));

		document.body.append(first, second);

		expect(
			getCurrentArgsValNavigationItem(
				[
					{ id: 'arg-1', label: 'Arg 1' },
					{ id: 'arg-2', label: 'Arg 2' }
				],
				scroller
			)
		).toEqual({ id: 'arg-2', label: 'Arg 2' });

		first.remove();
		second.remove();
	});
});
