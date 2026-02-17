/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, useMemo } from 'react';
import { Row } from '@tanstack/react-table';

import { RunDataResults } from '@/shared/types';
import { TableClassNames, cn, TwTable, Skeleton } from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import {
	computeResultsDiff,
	RunDataResultsWithDiff
} from './result-diff.utils';
import { getColumns } from './result-diff.columns';
import { DiffType } from '../run-diff/run-diff.types';

export const ResultDiffLoading = (props: { count?: number }) => {
	const { count = 25 } = props;

	return (
		<div className="flex flex-col gap-1 p-2">
			<Skeleton className="rounded-b h-[38px]" />
			{Array(count)
				.fill(1)
				.map((_, idx) => (
					<Skeleton key={idx} className="h-32" />
				))}
		</div>
	);
};

interface ResultDiffErrorProps {
	error: unknown;
}

export const ResultDiffError = ({ error }: ResultDiffErrorProps) => {
	return <BublikErrorState error={error} />;
};

export const ResultDiffEmpty = () => {
	return (
		<BublikEmptyState title="No data" description="No diff data available" />
	);
};

const gridClassName =
	'grid grid-cols-[26.5px,130px,1fr,1fr,35.5px,120px,1fr,1fr]';

const getBodyRowClassname = (row: Row<RunDataResultsWithDiff>) => {
	const { diffType } = row.original;

	const isAdded = diffType === DiffType.ADDED;
	const isRemoved = diffType === DiffType.REMOVED;
	const isChanged = diffType === DiffType.CHANGED;

	return cn(
		gridClassName,
		'[&>*:not(:first-of-type)]:py-2 [&>*:not(:first-of-type)]:px-1 transition-colors',
		'bg-primary-wash rounded-md',
		isAdded && 'bg-diff-added',
		isRemoved && 'bg-diff-removed',
		isChanged && 'bg-yellow-50'
	);
};

const classNames: TableClassNames<RunDataResultsWithDiff> = {
	header: 'sticky top-[66px] z-10',
	headerRow: `h-[38px] bg-primary-wash rounded-b ${gridClassName}`,
	headerCell: (cell) => {
		const columnId = cell.column.id;
		return cn(
			'text-[0.6875rem] font-semibold leading-[0.875rem] justify-start flex items-center',
			columnId === 'GUTTER_RIGHT' && 'border-l border-r border-border-primary',
			columnId === 'GUTTER_LEFT' && 'border-r border-border-primary',
			columnId.startsWith('ACTIONS') && 'pl-2.5'
		);
	},
	body: 'space-y-1 [&>:first-of-type]:mt-1',
	bodyRow: getBodyRowClassname,
	bodyCell: (cell) => {
		const columnId = cell.column.id;
		return cn(
			columnId === 'GUTTER_RIGHT' && 'border-l border-r border-border-primary',
			columnId === 'GUTTER_LEFT' && 'border-r border-border-primary',
			columnId.startsWith('ACTIONS') && 'pl-2.5'
		);
	}
};

export interface ResultDiffProps {
	leftRunId: string;
	rightRunId: string;
	left?: RunDataResults[];
	right?: RunDataResults[];
}

export const ResultDiff: FC<ResultDiffProps> = (props) => {
	const { leftRunId, rightRunId, left = [], right = [] } = props;

	const rowsDiff = useMemo(() => {
		return computeResultsDiff({ left, right }).filter(
			(row) => row.diffType !== 'default'
		);
	}, [left, right]);

	const columns = useMemo(
		() => getColumns(leftRunId, rightRunId),
		[leftRunId, rightRunId]
	);

	return (
		<div className="p-2 bg-white">
			<TwTable<RunDataResultsWithDiff>
				data={rowsDiff}
				columns={columns}
				classNames={classNames}
				enableSorting={false}
				manualPagination
			/>
		</div>
	);
};
