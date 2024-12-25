/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Row } from '@tanstack/react-table';

import { ButtonTw, cn, Separator, twButtonStyles } from '@/shared/tailwind-ui';

import { LogTableData } from '@/shared/types';

export interface TableDepthFilterProps {
	maxDepth: number;
	onDepthClick: (depth: number) => void;
	flatRows: Row<LogTableData>[];
	className?: string;
}

export const TableDepthFilter = (props: TableDepthFilterProps) => {
	const { maxDepth, onDepthClick, flatRows, className } = props;

	const handleDepthClick = (depth: number) => () => {
		onDepthClick(depth);
	};

	return (
		<div
			className={cn(
				twButtonStyles({ variant: 'outline' }),
				'w-full py-0.5',
				className
			)}
		>
			<span className="text-xs">Nesting Level</span>
			<Separator
				orientation="vertical"
				className="shrink-0 bg-border-primary w-px h-4 mx-2"
			/>
			<ul className="flex items-center gap-1">
				{Array.from(Array(maxDepth + 1).keys()).map((depth) => {
					const rowsThatCanExpand = flatRows.filter(
						(row) =>
							Array.isArray(row.original.children) && row.depth <= depth - 1
					);

					const isPartiallyActive = flatRows
						.filter(
							(row) =>
								Array.isArray(row.original.children) && row.depth >= depth - 1
						)
						.some((row) => row.getIsExpanded());

					const isActive = rowsThatCanExpand.every((row) =>
						row.getIsExpanded()
					);

					return (
						<li key={depth}>
							<ButtonTw
								size="xss"
								variant="outline"
								state={isActive && 'active'}
								onClick={handleDepthClick(depth)}
								className={cn(
									'px-2.5 hover:bg-gray-100',
									isPartiallyActive &&
										'bg-bg-ok/50 hover:bg-bg-ok hover:text-white text-white border-bg-ok border-opacity-0',
									isActive && 'bg-bg-ok hover:bg-bg-ok hover:text-white'
								)}
							>
								{depth}
							</ButtonTw>
						</li>
					);
				})}
			</ul>
		</div>
	);
};
