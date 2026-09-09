/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import { Skeleton, cn } from '@/shared/tailwind-ui';

export type HistoryLegendItem =
	| 'runs'
	| 'iterations'
	| 'results'
	| 'expected'
	| 'unexpected';

export interface HistoryLegendBadgeProps {
	resultType: 'expected' | 'unexpected';
}

const HistoryLegendBadge: FC<HistoryLegendBadgeProps> = ({ resultType }) => {
	return (
		<div
			className={cn(
				'flex w-fit items-center rounded py-0.5 px-2',
				resultType === 'expected' ? 'bg-badge-3' : 'bg-badge-5'
			)}
		>
			<span
				className={cn(
					'text-[0.6875rem] leading-[0.875rem]',
					resultType === 'expected'
						? 'text-text-expected'
						: 'text-text-unexpected'
				)}
			>
				{resultType === 'expected' ? 'Expected' : 'Unexpected'}
			</span>
		</div>
	);
};

export interface HistoryLegendCountItemLoadingProps {
	label: string;
	resultType?: 'expected' | 'unexpected';
}

export const HistoryLegendCountItemLoading = (
	props: HistoryLegendCountItemLoadingProps
) => {
	const { label, resultType } = props;

	return (
		<div className="flex flex-col justify-between gap-1">
			<div className="flex items-center justify-start gap-2">
				<Skeleton className="w-full h-[18px] min-w-6 rounded inline-block" />
				{resultType ? <HistoryLegendBadge resultType={resultType} /> : null}
			</div>
			<span className="text-[0.6875rem] leading-[0.875rem] text-text-menu">
				{label}
			</span>
		</div>
	);
};

export interface HistoryLegendCountItemProps {
	count: number;
	label: string;
	item: HistoryLegendItem;
	resultType?: 'expected' | 'unexpected';
}

export const HistoryLegendCountItem: FC<HistoryLegendCountItemProps> = (
	props
) => {
	const { count, label, item, resultType } = props;

	return (
		<div
			className="flex flex-col justify-between gap-1"
			data-legend-item={item}
		>
			<div className="flex items-center justify-start gap-2">
				<span
					className="text-[0.875rem] font-semibold leading-[1.125rem]"
					data-legend-count={item}
				>
					{count}
				</span>
				{resultType ? <HistoryLegendBadge resultType={resultType} /> : null}
			</div>
			<span className="text-[0.6875rem] leading-[0.875rem] text-text-menu">
				{label}
			</span>
		</div>
	);
};

export const HistoryLegendCountLoading = () => {
	return (
		<div className="flex flex-wrap gap-14" data-testid="history-legend-count">
			<HistoryLegendCountItemLoading label="Runs" />
			<HistoryLegendCountItemLoading label="Iterations" />
			<HistoryLegendCountItemLoading label="Test Results" />
			<HistoryLegendCountItemLoading
				label="Expected Results"
				resultType="expected"
			/>
			<HistoryLegendCountItemLoading
				label="Unexpected Results"
				resultType="unexpected"
			/>
		</div>
	);
};

export interface HeaderStatsProps {
	runs?: number;
	iterations?: number;
	results?: number;
	expected?: number;
	unexpected?: number;
}

export const HistoryLegendCount = (props: HeaderStatsProps) => {
	const {
		runs = 0,
		iterations = 0,
		results = 0,
		expected = 0,
		unexpected = 0
	} = props;

	return (
		<div className="flex flex-wrap gap-14" data-testid="history-legend-count">
			<HistoryLegendCountItem item="runs" label="Runs" count={runs} />
			<HistoryLegendCountItem
				item="iterations"
				label="Iterations"
				count={iterations}
			/>
			<HistoryLegendCountItem
				item="results"
				label="Test Results"
				count={results}
			/>
			<HistoryLegendCountItem
				item="expected"
				label="Expected Results"
				count={expected}
				resultType="expected"
			/>
			<HistoryLegendCountItem
				item="unexpected"
				label="Unexpected Results"
				count={unexpected}
				resultType="unexpected"
			/>
		</div>
	);
};
