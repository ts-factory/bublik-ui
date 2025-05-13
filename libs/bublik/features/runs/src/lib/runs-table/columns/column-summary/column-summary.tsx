/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import { routes } from '@/router';
import { useNavigateWithProject } from '@/bublik/features/projects';

import { SummaryBadge } from './summary-badge';

export interface ColumnSummaryProps {
	runId: number;
	totalCount: number;
	totalPlannedPercentage: number;
	expectedCount: number;
	expectedPercentage: number;
	unexpectedCount: number;
	unexpectedPercentage: number;
}

export const ColumnSummary: FC<ColumnSummaryProps> = ({
	runId,
	totalCount,
	totalPlannedPercentage,
	expectedCount,
	expectedPercentage,
	unexpectedCount,
	unexpectedPercentage
}) => {
	const navigate = useNavigateWithProject();

	const to = routes.run({ runId });

	return (
		<div className="flex flex-wrap items-start justify-start gap-1">
			<SummaryBadge
				to={to}
				label="Total"
				count={totalCount}
				percentage={totalPlannedPercentage}
				className="bg-badge-9"
			/>
			<SummaryBadge
				to={to}
				label="OK"
				count={expectedCount}
				percentage={expectedPercentage}
				className="bg-badge-3"
			/>
			<SummaryBadge
				to={to}
				state={{ openUnexpected: true }}
				onContextMenu={(e) => {
					e.preventDefault();

					if (e.ctrlKey) {
						navigate(to, { state: { openUnexpectedResults: true } });
					} else {
						navigate(to, { state: { openUnexpected: true } });
					}
				}}
				onClick={(e) => {
					e.preventDefault();

					if (e.ctrlKey) {
						navigate(to, { state: { openUnexpectedResults: true } });
					} else {
						navigate(to, { state: { openUnexpected: true } });
					}
				}}
				label="NOK"
				count={unexpectedCount}
				percentage={unexpectedPercentage}
				className="bg-badge-5"
			/>
		</div>
	);
};
