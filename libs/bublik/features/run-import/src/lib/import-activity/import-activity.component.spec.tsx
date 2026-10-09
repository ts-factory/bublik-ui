/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { type ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ImportTaskRow } from '@/shared/types';

import {
	ImportActivityIndicator,
	ImportActivityList
} from './import-activity.component';

vi.mock('@/bublik/features/projects', async () => {
	const { forwardRef } = await import('react');

	return {
		LinkWithProject: forwardRef<
			HTMLAnchorElement,
			{ to: string; children: ReactNode }
		>(({ to, children, ...props }, ref) => (
			<a ref={ref} href={to} {...props}>
				{children}
			</a>
		))
	};
});

function createRow(overrides: Partial<ImportTaskRow>): ImportTaskRow {
	return {
		status: 'RUNNING',
		run_source_url: 'https://logs.example.com/runs/1',
		celery_task: 'task-1',
		started_at: '2026-10-09T10:00:00Z',
		finished_at: null,
		runtime: null,
		job_id: 1,
		run_id: null,
		event_logs: [],
		error_msg: null,
		...overrides
	};
}

describe('ImportActivityList', () => {
	it('links each import to its live log', () => {
		render(
			<ImportActivityList
				imports={[
					createRow({
						job_id: 1,
						celery_task: 'abc-123',
						event_logs: [
							{
								timestamp: '2026-10-09T10:00:01Z',
								facility: 'importruns',
								severity: 'INFO',
								msg: 'Downloading logs'
							}
						]
					})
				]}
				total={1}
			/>
		);

		const item = screen.getByTestId('import-activity-item');

		expect(within(item).getByRole('link').getAttribute('href')).toBe(
			'/admin/import?taskId=abc-123&poll=1'
		);
		expect(within(item).getByText('Downloading logs')).toBeTruthy();
		expect(screen.getByText('Imports in progress · 1')).toBeTruthy();
	});

	it('shows queued imports and how many are not listed', () => {
		render(
			<ImportActivityList
				imports={[
					createRow({ job_id: 1 }),
					createRow({ job_id: 2, status: 'RECEIVED', celery_task: null })
				]}
				total={5}
			/>
		);

		const [, queued] = screen.getAllByTestId('import-activity-item');

		expect(within(queued).getByText('RECEIVED')).toBeTruthy();
		expect(within(queued).queryByRole('link')).toBeNull();
		expect(screen.getByText('and 3 more')).toBeTruthy();
	});
});

describe('ImportActivityIndicator', () => {
	it('labels the indicator with the active import count', () => {
		render(
			<ImportActivityIndicator
				imports={[createRow({ job_id: 1 }), createRow({ job_id: 2 })]}
				total={2}
				isSidebarOpen
			/>
		);

		expect(
			screen.getByTestId('import-activity-indicator').getAttribute('aria-label')
		).toBe('2 imports in progress');
	});
});
