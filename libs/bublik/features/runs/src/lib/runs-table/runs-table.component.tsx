/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, useMemo } from 'react';
import {
	PaginationState,
	OnChangeFn,
	TableState,
	RowSelectionState
} from '@tanstack/react-table';

import { RunsData } from '@/shared/types';
import { getErrorMessage } from '@/services/bublik-api';
import {
	TwTable,
	TableClassNames,
	TwTableProps,
	Skeleton,
	Icon
} from '@/shared/tailwind-ui';

import { columns } from './runs-table.columns';
import { globalFilterFn } from './runs-table.utils';

export const RunsTableLoading = (props: { count: number }) => {
	return (
		<div className="flex flex-col gap-1">
			<Skeleton className="h-[32px]" />
			{Array.from({ length: props.count }).map((_, idx) => (
				<Skeleton key={idx} className="h-[110px] rounded" />
			))}
		</div>
	);
};

export interface RunsTableErrorProps {
	error?: unknown;
}

export const RunsTableError = (props: RunsTableErrorProps) => {
	const { error = {} } = props;
	const { title, description, status } = getErrorMessage(error);

	return (
		<div className="grid place-items-center h-[calc(100vh-256px)]">
			<div className="flex flex-col items-center text-center">
				<Icon
					name="TriangleExclamationMark"
					size={24}
					className="text-text-unexpected"
				/>
				<h3 className="mt-2 text-sm font-medium text-gray-900">
					{status} {title}
				</h3>
				<p className="mt-1 text-sm text-gray-500">{description}</p>
			</div>
		</div>
	);
};

export const RunsTableEmpty = () => {
	return (
		<div className="grid place-items-center h-[calc(100vh-256px)]">
			<div className="flex flex-col items-center text-center">
				<Icon
					name="TriangleExclamationMark"
					size={24}
					className="text-primary"
				/>
				<h3 className="mt-2 text-sm font-medium text-gray-900">
					No runs found!
				</h3>
				<p className="mt-1 text-sm text-gray-500">
					Try changing your search or filter to find what you are looking for.
				</p>
			</div>
		</div>
	);
};

const getRowId = (runsData: RunsData) => runsData.id.toString();

const getRowProps: (
	selection: string[],
	addSelection: RunsTableProps['addSelection'],
	removeSelection: RunsTableProps['removeSelection']
) => TwTableProps<RunsData>['getRowProps'] =
	(selection, addSelection, removeSelection) => (table, row) => {
		const MAX_SELECTION_NUMBER = 2;
		const className = row.getIsSelected()
			? 'bg-primary-wash border-primary'
			: '';

		return {
			onClick: (e) => {
				if (e.target instanceof Element && e.target.tagName !== 'DIV') return;

				const selectionState = table.getState().rowSelection;
				const selectionKeys = Object.keys(selectionState);
				const isMaxLength = selectionKeys.length === MAX_SELECTION_NUMBER;

				const isInSelection = selectionKeys.includes(
					row.original.id.toString()
				);

				// 1. Remove
				if (isInSelection) {
					removeSelection(row.id);
					// 2. Add
				} else {
					if (isMaxLength) {
						const oldestId = selection.at(0);
						if (oldestId) removeSelection(oldestId);
						addSelection(row.id);
						return;
					}

					addSelection(row.id);
				}
			},
			className
		};
	};

const gridClassName =
	'grid grid-cols-[24px,96px,165px,minmax(372px,1fr),1.5fr,2fr,3fr]';

const classNames: TableClassNames<RunsData> = {
	header: 'sticky top-0 z-10',
	headerRow: `h-8 bg-white ${gridClassName}`,
	headerCell:
		'text-[0.6875rem] font-semibold leading-[0.875rem] justify-start flex items-center',
	body: 'space-y-1 [&>:first-of-type]:mt-1',
	bodyRow: `bg-white rounded-md [&>*:not(:first-of-type)]:py-2 [&>*:not(:first-of-type)]:px-1 ${gridClassName} border border-transparent hover:border-primary transition-colors`
};

export interface RunsTableProps {
	data: RunsData[];
	pagination: PaginationState;
	onPaginationChange: OnChangeFn<PaginationState>;
	pageCount: number;
	globalFilter: string[];
	onGlobalFilterChange: OnChangeFn<string[]>;
	rowSelection: RowSelectionState;
	selection: string[];
	addSelection: (runId: string) => void;
	removeSelection: (runId: string) => void;
}

export const RunsTable: FC<RunsTableProps> = (props) => {
	const {
		data,
		pagination,
		onPaginationChange,
		pageCount,
		onGlobalFilterChange,
		globalFilter,
		rowSelection,
		addSelection,
		removeSelection,
		selection
	} = props;

	const state = useMemo<Partial<TableState>>(
		() => ({ pagination, globalFilter, rowSelection }),
		[globalFilter, pagination, rowSelection]
	);

	return (
		<TwTable<RunsData>
			data={data}
			columns={columns}
			classNames={classNames}
			state={state}
			manualPagination
			pageCount={pageCount}
			onPaginationChange={onPaginationChange}
			globalFilterFn={globalFilterFn}
			onGlobalFilterChange={onGlobalFilterChange}
			getRowId={getRowId}
			stickyOffset={-1}
			getRowProps={getRowProps(selection, addSelection, removeSelection)}
		/>
	);
};
