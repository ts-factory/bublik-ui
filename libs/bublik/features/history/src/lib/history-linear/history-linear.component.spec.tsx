/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { TooltipProvider } from '@/shared/tailwind-ui';
import { RESULT_TYPE, type HistoryDataLinear } from '@/shared/types';

import { HistoryLinearTable } from './history-linear.component';

// jsdom has no IntersectionObserver for the sticky header to watch with.
vi.mock('@/shared/hooks', async (importOriginal) => ({
	...(await importOriginal<typeof import('@/shared/hooks')>()),
	useIsSticky: () => ({ isSticky: false })
}));

vi.mock('@/bublik/features/result-classification', () => ({
	ClassificationVerdict: (props: { withClassify?: boolean }) => (
		<span
			data-testid="classification-verdict"
			data-with-classify={String(props.withClassify ?? true)}
		/>
	)
}));

vi.mock('./column-components', () => ({
	IssueBadges: () => null,
	Links: () => null,
	RunTime: () => null
}));

vi.mock('../history-context-menu', () => ({
	HistoryContextMenuContainer: ({ children }: { children: ReactNode }) => (
		<>{children}</>
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
