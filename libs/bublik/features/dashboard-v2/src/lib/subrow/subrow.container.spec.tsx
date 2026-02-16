/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Row } from '@tanstack/react-table';

import { RUN_STATUS, DashboardData } from '@/shared/types';

import { renderSubrow } from './subrow.container';

vi.mock('../run-progress', () => {
	return {
		RunProgressContainer: ({ runId }: { runId: number }) => (
			<div data-testid="run-progress">Run progress for {runId}</div>
		)
	};
});

describe('renderSubrow', () => {
	it('renders only run progress content without destination links', () => {
		const row = {
			original: {
				context: {
					run_id: 42,
					conclusion: RUN_STATUS.Ok
				}
			}
		} as Row<DashboardData>;

		render(renderSubrow(row));

		expect(screen.getByTestId('run-progress')).toHaveTextContent(
			'Run progress for 42'
		);
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
	});
});
