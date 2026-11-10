/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ReactNode } from 'react';

import {
	Badge,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	Icon,
	Separator,
	cn
} from '@/shared/tailwind-ui';

export interface ChipMenuProps {
	/** Chip content, e.g. "param=value". */
	label: ReactNode;
	/** Render the chip dashed, for "nothing chosen". */
	dashed?: boolean;
	disabled?: boolean;
	className?: string;
	children: ReactNode;
}

/**
 * A parameter badge that opens a dropdown menu; used by the matrix toolbar.
 * Styled like the parameter badges in the run table so the facet filters
 * read as parameters.
 */
export function ChipMenu(props: ChipMenuProps) {
	const { label, dashed, disabled, className, children } = props;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild disabled={disabled}>
				<Badge
					as="button"
					type="button"
					className={cn(
						'pr-1 transition-colors hover:border-primary disabled:opacity-60',
						dashed
							? 'border-dashed border-border-primary bg-transparent text-text-menu'
							: 'bg-badge-1',
						className
					)}
				>
					{label}
					{/* Same divider and arrow as the History split button. */}
					<Separator
						orientation="vertical"
						className={cn('mx-1 h-3.5', dashed && 'bg-text-menu/40')}
					/>
					<Icon name="ArrowShortTop" size={16} className="rotate-180" />
				</Badge>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="min-w-[10rem]">
				{children}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
