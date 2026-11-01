/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { RESULT_TYPE, type ResultData } from '@/shared/types';

interface FakeSelection {
	isSelected: (resultId: number) => boolean;
	select: ReturnType<typeof vi.fn>;
	deselect: ReturnType<typeof vi.fn>;
}

let selection: FakeSelection | null = null;

vi.mock('@/bublik/features/result-classification', () => ({
	isClassifiable: (row: { has_error: boolean }) => row.has_error,
	useResultSelection: () => selection
}));

// Icons do not resolve under vitest; `SortArrow` is read at import time by
// the tailwind-ui barrel.
vi.mock('@/icons', () => ({ SortArrow: () => null }));

// The verdict, its badges and the result links are controls of their own.
vi.mock('@/shared/tailwind-ui', async (importOriginal) => ({
	...(await importOriginal<typeof import('@/shared/tailwind-ui')>()),
	VerdictResult: () => <button>FAILED</button>,
	ListOfVerdicts: () => null
}));

vi.mock('../aggregation-tooltip', () => ({
	AggregationTooltip: ({ children }: { children: ReactNode }) => children
}));

vi.mock('@/bublik/features/projects', () => ({
	LinkWithProject: ({ children }: { children: ReactNode }) => (
		<a href="#log">{children}</a>
	)
}));

// The filter menu is portaled out of the group it wraps, as Radix does.
vi.mock('../../../history-context-menu', () => ({
	HistoryContextMenuContainer: ({ children }: { children: ReactNode }) => (
		<div>
			{children}
			{createPortal(<div role="menuitem">Add to filter</div>, document.body)}
		</div>
	)
}));

const { ResultList } = await import('./results-list');

function group(overrides: Partial<ResultData> = {}): ResultData {
	return {
		key: 'FAILED-boom',
		has_error: true,
		result_type: RESULT_TYPE.Failed,
		verdict: ['boom'],
		results_data: [1, 2].map((resultId) => ({
			result_id: resultId,
			run_id: resultId * 10,
			start_date: '2026-10-01T10:00:00Z',
			relevant_tags: [],
			important_tags: []
		})),
		...overrides
	};
}

function pick(picked: number[] = []): FakeSelection {
	selection = {
		isSelected: (resultId) => picked.includes(resultId),
		select: vi.fn(),
		deselect: vi.fn()
	};

	return selection;
}

function renderList(results: ResultData[]) {
	render(
		<ResultList
			results={results}
			selectedVerdicts={[]}
			onVerdictClick={vi.fn()}
			onResultClick={vi.fn()}
			selectedResultType={{ resultType: null, isNotExpected: null }}
		/>
	);
}

function verdictGroup() {
	return screen.getByTestId('history-verdict-group');
}

describe('ResultList — picking verdict groups', () => {
	beforeEach(() => {
		selection = null;
	});

	it('picks every result of a failing group', () => {
		const { select } = pick();
		renderList([group()]);

		fireEvent.click(verdictGroup());

		expect(select).toHaveBeenCalledWith([
			{ result_id: 1, run_id: 10, has_error: true },
			{ result_id: 2, run_id: 20, has_error: true }
		]);
	});

	it('drops a group whose results are all picked', () => {
		const { select, deselect } = pick([1, 2]);
		renderList([group()]);

		expect(verdictGroup().hasAttribute('data-selected')).toBe(true);
		fireEvent.click(verdictGroup());

		expect(deselect).toHaveBeenCalledWith([1, 2]);
		expect(select).not.toHaveBeenCalled();
	});

	it('leaves a group of expected results unpicked', () => {
		const { select } = pick();
		renderList([group({ has_error: false, result_type: RESULT_TYPE.Passed })]);

		fireEvent.click(verdictGroup());

		expect(select).not.toHaveBeenCalled();
		expect(verdictGroup().hasAttribute('data-selectable')).toBe(false);
	});

	it('leaves the group alone when its links or its filter menu are clicked', () => {
		const { select } = pick();
		renderList([group()]);

		fireEvent.click(screen.getAllByRole('link')[0]);
		fireEvent.click(screen.getByRole('button', { name: 'FAILED' }));
		fireEvent.click(screen.getByRole('menuitem'));

		expect(select).not.toHaveBeenCalled();
	});

	it('picks nothing outside a selection', () => {
		renderList([group()]);

		expect(verdictGroup().hasAttribute('data-selectable')).toBe(false);
	});
});
