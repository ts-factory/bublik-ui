/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useNavigateWithProject } from '@/bublik/features/projects';

import { SummaryBadge } from './summary-badge';
import { useMedia } from 'react-use';
import { cn } from '@/shared/tailwind-ui';

interface ColumnSummaryProps {
	runId: number;
	totalCount: number;
	totalPlannedPercentage: number;
	expectedCount: number;
	expectedPercentage: number;
	unexpectedCount: number;
	unexpectedPercentage: number;
}

function getUnexpectedNavigationState(openUnexpectedResults = false) {
	const openUnexpectedIntentId = `${Date.now()}-${Math.random()
		.toString(36)
		.slice(2)}`;

	if (openUnexpectedResults) {
		return { openUnexpectedResults: true, openUnexpectedIntentId };
	}

	return { openUnexpected: true, openUnexpectedIntentId };
}

function ColumnSummary(props: ColumnSummaryProps) {
	const {
		runId,
		totalCount,
		totalPlannedPercentage,
		expectedCount,
		expectedPercentage,
		unexpectedCount,
		unexpectedPercentage
	} = props;
	const navigate = useNavigateWithProject();

	return (
		<div
			className={cn(
				'flex items-start justify-start gap-1 flex-nowrap',
				'max-2xl:flex-wrap max-2xl:flex-col'
			)}
		>
			<SummaryBadge
				runId={runId}
				label="Total"
				count={totalCount}
				percentage={totalPlannedPercentage}
				className="bg-badge-9"
			/>
			<SummaryBadge
				runId={runId}
				label="OK"
				count={expectedCount}
				percentage={expectedPercentage}
				className="bg-badge-3"
			/>
			<SummaryBadge
				runId={runId}
				state={getUnexpectedNavigationState()}
				onContextMenu={(e) => {
					e.preventDefault();

					if (e.ctrlKey) {
						navigate({
							to: '/runs/$runId',
							params: { runId },
							state: getUnexpectedNavigationState(true)
						});
					} else {
						navigate({
							to: '/runs/$runId',
							params: { runId },
							state: getUnexpectedNavigationState()
						});
					}
				}}
				onClick={(e) => {
					e.preventDefault();

					if (e.ctrlKey) {
						navigate({
							to: '/runs/$runId',
							params: { runId },
							state: getUnexpectedNavigationState(true)
						});
					} else {
						navigate({
							to: '/runs/$runId',
							params: { runId },
							state: getUnexpectedNavigationState()
						});
					}
				}}
				label="NOK"
				count={unexpectedCount}
				percentage={unexpectedPercentage}
				className="bg-badge-5"
			/>
		</div>
	);
}

export { ColumnSummary };
