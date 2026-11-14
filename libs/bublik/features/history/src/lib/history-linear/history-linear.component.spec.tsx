/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { TooltipProvider } from '@/shared/tailwind-ui';
import { RESULT_TYPE, type HistoryDataLinear } from '@/shared/types';

import { HistoryLinearTable } from './history-linear.component';

// jsdom has no IntersectionObserver for the sticky header to watch with.
vi.mock('@/shared/hooks', async (importOriginal) => ({
	...(await importOriginal<typeof import('@/shared/hooks')>()),
	useIsSticky: () => ({ isSticky: false })
}));

interface FakeSelection {
	isSelected: (resultId: number) => boolean;
	toggle: ReturnType<typeof vi.fn>;
}

let selection: FakeSelection | null = null;

vi.mock('@/bublik/features/result-classification', () => ({
	ClassificationVerdict: (props: { withClassify?: boolean }) => (
		<span
			data-testid="classification-verdict"
			data-with-classify={String(props.withClassify ?? true)}
		/>
	),
	// A failure, or a result with a stamp, as the lib's own rule has it.
	isClassifiable: (row: HistoryDataLinear) =>
		row.has_error || Boolean(row.issues?.length),
	useResultSelection: () => selection
}));

vi.mock('./column-components', () => ({
	IssueBadges: () => null,
	Links: () => null,
	RunTime: () => null
}));

// The filter menu is portaled out of the cell it wraps, as Radix does.
vi.mock('../history-context-menu', () => ({
	HistoryContextMenuContainer: ({ children }: { children: ReactNode }) => (
		<div>
			{children}
			{createPortal(<div role="menuitem">Add to filter</div>, document.body)}
		</div>
	)
}));

function row(overrides: Partial<HistoryDataLinear> = {}): HistoryDataLinear {
	return {
		start_date: '2026-10-01T10:00:00Z',
		finish_date: '2026-10-01T10:01:00Z',
		duration: '00:01:00',
		obtained_result: { result_type: RESULT_TYPE.Failed, verdicts: ['boom'] },
		expected_results: [{ result_type: RESULT_TYPE.Passed, verdicts: [] }],
		relevant_tags: [],
		metadata: [],
		parameters: [],
		has_error: true,
		has_measurements: false,
		run_id: 7,
		project_id: 3,
		project_name: 'alpha',
		result_id: 4242,
		iteration_id: 11,
		important_tags: [],
		issues: [],
		...overrides
	};
}

function renderTable(data: HistoryDataLinear[]) {
	return render(
		<TooltipProvider>
			<HistoryLinearTable
				data={data}
				pageCount={data.length}
				pagination={{ pageIndex: 0, pageSize: 25 }}
				onPaginationChange={vi.fn()}
				globalFilter={{
					tags: [],
					verdicts: [],
					parameters: [],
					resultType: null,
					isNotExpected: null
				}}
				onGlobalFilterChange={vi.fn()}
			/>
		</TooltipProvider>
	);
}

describe('HistoryLinearTable — classification', () => {
	it('draws the verdict chip without a Classify button of its own', () => {
		renderTable([row({ result_id: 4242, project_id: 3 })]);

		expect(
			screen
				.getByTestId('classification-verdict')
				.getAttribute('data-with-classify')
		).toBe('false');
		expect(screen.queryByText('Classify')).toBeNull();
	});

	it('names each row by its result', () => {
		renderTable([row({ result_id: 1 }), row({ result_id: 2 })]);

		const ids = screen
			.getAllByRole('row')
			.map((element) => element.getAttribute('data-result-id'))
			.filter(Boolean);

		expect(ids).toEqual(['1', '2']);
	});
});

describe('HistoryLinearTable — picking rows', () => {
	beforeEach(() => {
		selection = null;
	});

	function pick(picked: number[] = []): FakeSelection {
		selection = {
			isSelected: (resultId) => picked.includes(resultId),
			toggle: vi.fn()
		};

		return selection;
	}

	function rowOf(resultId: number) {
		return screen
			.getAllByRole('row')
			.find(
				(element) => element.getAttribute('data-result-id') === String(resultId)
			);
	}

	function clickRow(resultId: number) {
		const cell = rowOf(resultId)?.querySelector('[role="cell"]');
		if (!cell) throw new Error(`No row for result ${resultId}`);
		fireEvent.click(cell);
	}

	it('picks a failing row into the selection', () => {
		const { toggle } = pick();
		const failing = row({ result_id: 7, run_id: 70 });
		renderTable([failing]);

		clickRow(7);

		expect(toggle).toHaveBeenCalledWith(failing);
		expect(rowOf(7)?.hasAttribute('data-selectable')).toBe(true);
	});

	it('leaves a plain pass unpicked', () => {
		const { toggle } = pick();
		renderTable([
			row({
				result_id: 8,
				has_error: false,
				obtained_result: { result_type: RESULT_TYPE.Passed, verdicts: [] }
			})
		]);

		clickRow(8);

		expect(toggle).not.toHaveBeenCalled();
		expect(rowOf(8)?.hasAttribute('data-selectable')).toBe(false);
	});

	it('marks a picked row', () => {
		pick([9]);
		renderTable([row({ result_id: 9 }), row({ result_id: 10 })]);

		expect(rowOf(9)?.hasAttribute('data-selected')).toBe(true);
		expect(rowOf(10)?.hasAttribute('data-selected')).toBe(false);
	});

	it('leaves the row alone when a control in it is clicked', () => {
		const { toggle } = pick();
		renderTable([row({ result_id: 11 })]);

		// The obtained result's verdict is a filter chip: a button of its own.
		fireEvent.click(screen.getByRole('button', { name: 'boom' }));

		expect(toggle).not.toHaveBeenCalled();
	});

	it('leaves the row alone when an item of its portaled filter menu is clicked', () => {
		const { toggle } = pick();
		renderTable([row({ result_id: 13 })]);

		fireEvent.click(screen.getAllByRole('menuitem')[0]);

		expect(toggle).not.toHaveBeenCalled();
	});

	it('picks nothing outside a selection', () => {
		renderTable([row({ result_id: 12 })]);

		clickRow(12);

		expect(rowOf(12)?.hasAttribute('data-selectable')).toBe(false);
	});
});
