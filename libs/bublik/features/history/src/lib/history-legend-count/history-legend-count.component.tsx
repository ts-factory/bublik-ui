/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import { Skeleton, cn } from '@/shared/tailwind-ui';

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
	resultType?: 'expected' | 'unexpected';
}

export const HistoryLegendCountItem: FC<HistoryLegendCountItemProps> = (
	props
) => {
	const { count, label, resultType } = props;

	return (
		<div className="flex flex-col justify-between gap-1">
			<div className="flex items-center justify-start gap-2">
				<span className="text-[0.875rem] font-semibold leading-[1.125rem]">
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
		<div className="flex flex-wrap gap-14">
			<HistoryLegendCountItemLoading label="Runs" />
			<HistoryLegendCountItemLoading label="Iterations" />
			<HistoryLegendCountItemLoading label="Test results" />
			<HistoryLegendCountItemLoading
				label="Expected results"
				resultType="expected"
			/>
			<HistoryLegendCountItemLoading
				label="Unexpected results"
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
		<div className="flex flex-wrap gap-14">
			<HistoryLegendCountItem label="Runs" count={runs} />
			<HistoryLegendCountItem label="Iterations" count={iterations} />
			<HistoryLegendCountItem label="Test results" count={results} />
			<HistoryLegendCountItem
				label="Expected results"
				count={expected}
				resultType="expected"
			/>
			<HistoryLegendCountItem
				label="Unexpected results"
				count={unexpected}
				resultType="unexpected"
			/>
		</div>
	);
};
