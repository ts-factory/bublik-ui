/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo, useState } from 'react';
import { Table } from '@tanstack/react-table';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
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

import { useExpandUnexpected } from './hooks';
import { hasUnexpected } from './utils';
import { DEFAULT_COLUMN_VISIBILITY } from './constants';
import { ColumnId } from './types';
import { useGlobalRequirements } from '../hooks';

export interface ToolbarProps {
	table: Table<RunData | MergedRun>;
}

export const Toolbar = ({ table }: ToolbarProps) => {
	const { resetGlobalRequirements } = useGlobalRequirements();
	const { showUnexpected, expandUnexpected, reset } = useExpandUnexpected({
		table
	});

	const [isOpen, setIsOpen] = useState(false);

	const handleColumnsOpenChange = (open: boolean) => {
		if (open) {
			trackEvent(analyticsEventNames.runTableToolbarColumnsOpen, {
				source: 'columns_dropdown'
			});
		}

		setIsOpen(open);
	};

	const handleResetState = () => {
		trackEvent(analyticsEventNames.runTableToolbarReset, {
			source: 'toolbar'
		});

		table.setColumnVisibility(DEFAULT_COLUMN_VISIBILITY);
		reset();
		resetGlobalRequirements();

		const rootRowId = table.getCoreRowModel().flatRows?.[0]?.id;
		if (rootRowId) table.setExpanded({ [rootRowId]: true });
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
			<DropdownMenu open={isOpen} onOpenChange={handleColumnsOpenChange}>
				<DropdownMenuTrigger asChild>
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
								onCheckedChange={(checked) => {
									const isVisible = Boolean(checked);

									trackEvent(
										analyticsEventNames.runTableToolbarColumnVisibilityToggle,
										{
											columnId: column.id,
											visible: isVisible
										}
									);

									column.toggleVisibility(isVisible);
								}}
								className="text-xs"
							>
								{column.id
									.toLowerCase()
									.replace(/_/g, ' ')
									.replace(/ expected$| unexpected$/i, '')
									.replace(/\b\w/g, (c) => c.toUpperCase())
									.trim()}
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
					onClick={() => {
						trackEvent(analyticsEventNames.runTableToolbarPreviewNok, {
							hasUnexpected: tableHasUnexpected
						});

						showUnexpected();
					}}
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
					onClick={() => {
						trackEvent(analyticsEventNames.runTableToolbarOpenNok, {
							hasUnexpected: tableHasUnexpected
						});

						expandUnexpected();
					}}
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
