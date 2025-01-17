/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { Table } from '@tanstack/react-table';
import { useState } from 'react';
import { upperCaseFirstLetter } from '@/shared/utils';
import { LogTableData } from '@/shared/types';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
	Icon,
	ButtonTw,
	cn,
	DropdownMenuLabel,
	Separator
} from '@/shared/tailwind-ui';

interface ColumnToggleProps {
	table: Table<LogTableData>;
	className?: string;
}

function ColumnToggle({ table, className }: ColumnToggleProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<DropdownMenu open={isOpen}>
			<DropdownMenuTrigger asChild onClick={() => setIsOpen(true)}>
				<ButtonTw
					size="xs/2"
					state={isOpen && 'active'}
					variant="outline-secondary"
					className={cn('w-full', className)}
				>
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
				<DropdownMenuLabel className="py-2 text-xs">
					Column Visibility
				</DropdownMenuLabel>
				<Separator className="h-px my-1 -mx-1" />
				{table.getAllLeafColumns().map((column) => (
					<DropdownMenuCheckboxItem
						key={column.id}
						checked={column.getIsVisible()}
						onCheckedChange={column.toggleVisibility}
						className="text-xs"
					>
						{column.id
							.split('_')
							.map((id) => upperCaseFirstLetter(id.toLowerCase()))
							.join(' ')}
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export { ColumnToggle };
