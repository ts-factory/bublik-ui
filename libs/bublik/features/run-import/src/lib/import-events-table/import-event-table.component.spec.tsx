/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';
import { ExpandedState, PaginationState } from '@tanstack/react-table';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { store } from '@/bublik/+state';
import { ImportTaskRow } from '@/shared/types';
import { TooltipProvider } from '@/shared/tailwind-ui';

import {
	ImportEventTable,
	ImportEventTableEmpty,
	ImportEventTableError,
	ImportEventTableLoading
} from './import-event-table.component';

vi.mock('./import-log.component', () => ({
	useImportLog: () => ({
		toggle: () => () => undefined
	})
}));

function EventTableDemo() {
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 25
	});
	const [expanded, setExpanded] = useState<ExpandedState>({});

	return (
		<TooltipProvider>
			<Provider store={store}>
				<ImportEventTable
					data={[]}
					pagination={pagination}
					setPagination={setPagination}
					expanded={expanded}
					setExpanded={setExpanded}
					isScrolled={false}
					rowCount={0}
				/>
			</Provider>
		</TooltipProvider>
	);
}

function EventTableWithData({ data }: { data: ImportTaskRow[] }) {
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 25
	});
	const [expanded, setExpanded] = useState<ExpandedState>({});

	return (
		<TooltipProvider>
			<Provider store={store}>
				<ImportEventTable
					data={data}
					pagination={pagination}
					setPagination={setPagination}
					expanded={expanded}
					setExpanded={setExpanded}
					isScrolled={false}
					rowCount={data.length}
				/>
			</Provider>
		</TooltipProvider>
	);
}

function createImportTaskRow(
	runtime: number | null,
	jobId: number
): ImportTaskRow {
	return {
		status: 'SUCCESS',
		run_source_url: `https://example.com/run/${jobId}`,
		celery_task: `task-${jobId}`,
		started_at: null,
		finished_at: null,
		runtime,
		job_id: jobId,
		run_id: null,
		event_logs: [],
		error_msg: null
	};
}

describe('ImportEventTableComponent', () => {
	it('should render successfully', () => {
		const { asFragment } = render(<EventTableDemo />);
		expect(asFragment()).toMatchSnapshot();
	});

	it('should render fixed-width runtime values', () => {
		const data: ImportTaskRow[] = [
			createImportTaskRow(0, 1),
			createImportTaskRow(0.42, 2),
			createImportTaskRow(1.355945, 3),
			createImportTaskRow(62.5, 4),
			createImportTaskRow(3600, 5),
			createImportTaskRow(59.995, 6),
			createImportTaskRow(-1, 7),
			createImportTaskRow(Number.NaN, 8)
		];

		render(<EventTableWithData data={data} />);

		expect(screen.getByText('00:00:00.00')).toBeTruthy();
		expect(screen.getByText('00:00:00.42')).toBeTruthy();
		expect(screen.getByText('00:00:01.36')).toBeTruthy();
		expect(screen.getByText('00:01:02.50')).toBeTruthy();
		expect(screen.getByText('01:00:00.00')).toBeTruthy();
		expect(screen.getByText('00:01:00.00')).toBeTruthy();
		expect(screen.getAllByText('-')).toHaveLength(2);
	});

	it('should render loading state', () => {
		const { asFragment } = render(<ImportEventTableLoading />);
		expect(asFragment()).toMatchSnapshot();
	});

	it('should render error state', () => {
		const { asFragment } = render(
			<ImportEventTableError error={{ status: 404 }} />
		);
		expect(asFragment()).toMatchSnapshot();
	});

	it('should render empty state', () => {
		const { asFragment } = render(<ImportEventTableEmpty />);
		expect(asFragment()).toMatchSnapshot();
	});
});
