/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CSSProperties, memo, useCallback, useMemo } from 'react';

import { RunDataResults } from '@/shared/types';
import {
	TwTable,
	TableClassNames,
	cn,
	Skeleton,
	TwTableProps
} from '@/shared/tailwind-ui';

import { getColumns } from './result-table.columns';
const HEADER_HEIGHT = 102;
const STICKY_OFFSET = HEADER_HEIGHT + 1;

export interface SkeletonProps {
	rowCount?: number;
}

export const ResultTableLoading = ({ rowCount = 25 }: SkeletonProps) => {
	return (
		<div className="flex flex-col gap-1 mt-1 mb-1">
			<Skeleton className="rounded-b h-[38px]" />
			{Array(rowCount)
				.fill(1)
				.map((_, idx) => (
					<Skeleton key={idx} className="h-[110px] rounded" />
				))}
		</div>
	);
};

export const ResultTableError = () => <div>Error...</div>;

export const ResultTableEmpty = () => <div>Empty...</div>;

const gridClassName = 'grid grid-cols-[120px,0.6fr,0.6fr,0.6fr,0.6fr,1fr]';

const getBodyRowClassName = () => {
	return cn(
		gridClassName,
		'py-2 px-1 transition-colors',
		'border border-transparent hover:border-primary',
		'bg-primary-wash rounded-md'
	);
};

const classNames: TableClassNames<RunDataResults> = {
	headerRow: `h-[38px] grid sticky bg-primary-wash rounded-b ${gridClassName} px-4`,
	headerCell:
		'text-[0.6875rem] font-semibold leading-[0.875rem] justify-start flex items-center',
	body: 'space-y-1 [&>:first-of-type]:mt-1',
	bodyRow: getBodyRowClassName,
	bodyCell: 'px-2'
};

export interface ResultTableProps {
	rowId: string;
	data: RunDataResults[];
	getRowProps: TwTableProps<RunDataResults>['getRowProps'];
	showLinkToRun?: boolean;
	height: number;
}

export const ResultTable = memo(
	({
		data = [],
		rowId,
		getRowProps,
		showLinkToRun = false,
		height
	}: ResultTableProps) => {
		const columns = useMemo(
			() => getColumns({ rowId, showLinkToRun, data }),
			[data, rowId, showLinkToRun]
		);

		const { stickyOffset, getHeaderProps } = useStickyHeader({
			hasFilters: hasToolbar,
			height
		});

		return (
			<div className="px-4 py-2">
				<TwTable
					data={data}
					getRowId={(row) => String(row.result_id)}
					columns={columns}
					classNames={classNames}
					stickyOffset={stickyOffset}
					manualPagination
					enableSorting={false}
					getRowProps={getRowProps}
					getHeaderProps={getHeaderProps}
				/>
			</div>
		);
	}
);
