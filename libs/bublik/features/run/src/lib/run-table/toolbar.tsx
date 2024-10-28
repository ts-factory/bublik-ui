/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo, useState } from 'react';
import { Table } from '@tanstack/react-table';

import { MergedRun, RunData } from '@/shared/types';
import { toolbarIcon } from '@/bublik/run-utils';
import {
	ButtonTw,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuTrigger,
	Icon,
	Separator,
	Tooltip
} from '@/shared/tailwind-ui';

import { useRowsContext } from './context';
import { useExpandUnexpected } from './hooks';
import { hasUnexpected } from './utils';
import { DEFAULT_COLUMN_VISIBILITY } from './constants';
import { ColumnId } from './types';

export interface ToolbarProps {
	table: Table<RunData | MergedRun>;
}

export const Toolbar = ({ table }: ToolbarProps) => {
	const { rowsIds, rowsValues } = useRowsContext();

	const { showUnexpected, expandUnexpected, reset } = useExpandUnexpected({
		table,
		rowsIds,
		rowsValues
	});

	const [isOpen, setIsOpen] = useState(false);

	const handleResetState = () => {
		table.setColumnVisibility(DEFAULT_COLUMN_VISIBILITY);
		reset();
	};

	const tableHasUnexpected = useMemo(
		() =>
			table
				.getPreFilteredRowModel()
				.flatRows.map((row) => row.original)
				.some(hasUnexpected),
		[table]
	);

	return (
		<div className="flex gap-3">
			<DropdownMenu open={isOpen}>
				<DropdownMenuTrigger asChild onClick={() => setIsOpen(true)}>
					<ButtonTw size="xss" variant="secondary" state={isOpen && 'active'}>
						Columns
						<Icon name="ArrowShortSmall" />
					</ButtonTw>
				</DropdownMenuTrigger>

				<DropdownMenuContent
					className="w-56 rounded-lg"
					onEscapeKeyDown={() => setIsOpen(false)}
					onInteractOutside={() => setIsOpen(false)}
					loop
				>
					<DropdownMenuLabel className="text-xs">
						Column Visibility
					</DropdownMenuLabel>
					<Separator className="h-px my-1 -mx-1" />
					{table
						.getAllLeafColumns()
						.filter(({ id }) => id !== ColumnId.Tree)
						.map((column) => (
							<DropdownMenuCheckboxItem
								key={column.id}
								checked={column.getIsVisible()}
								onCheckedChange={column.toggleVisibility}
								className="text-xs"
							>
								{`${column.id.charAt(0).toUpperCase()}${column.id
									.toLowerCase()
									.replace(/_expected|_unexpected/i, '')
									.slice(1)
									.trim()}`}
								{column.id.toLowerCase().includes('unexpected')
									? toolbarIcon['unexpected']
									: column.id.toLowerCase().includes('expected')
									? toolbarIcon['expected']
									: column.id.toLowerCase().includes('abnormal')
									? toolbarIcon['abnormal']
									: null}
							</DropdownMenuCheckboxItem>
						))}
				</DropdownMenuContent>
			</DropdownMenu>
			<Tooltip content="Preview rows containing not expected results">
				<ButtonTw
					variant="secondary"
					state={!tableHasUnexpected ? 'disabled' : 'default'}
					size="xss"
					onClick={showUnexpected}
				>
					<Icon name="EyeShow" size={20} className="mr-1.5" />
					Preview NOK
				</ButtonTw>
			</Tooltip>
			<Tooltip content="Open rows containing not expected resutls">
				<ButtonTw
					variant="secondary"
					state={!tableHasUnexpected ? 'disabled' : 'default'}
					size="xss"
					onClick={expandUnexpected}
				>
					<Icon name="Scan" size={20} className="mr-1.5" />
					Open NOK
				</ButtonTw>
			</Tooltip>
			<Tooltip content="Reset table to default state">
				<ButtonTw variant="secondary" size="xss" onClick={handleResetState}>
					<Icon
						name="Refresh"
						size={20}
						className="mr-1.5"
						style={{ transform: 'scaleX(-1)' }}
					/>
					Reset
				</ButtonTw>
			</Tooltip>
		</div>
	);
};
