/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ReactNode } from 'react';

import {
	ButtonTw,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	Icon,
	cn
} from '@/shared/tailwind-ui';

export interface ChipMenuProps {
	/** Text before the chip, e.g. "Rows". */
	prefix?: ReactNode;
	/** Chip content. */
	label: ReactNode;
	/** Render the chip dashed, for "nothing chosen". */
	dashed?: boolean;
	disabled?: boolean;
	className?: string;
	children: ReactNode;
}

/** A labelled chip that opens a dropdown menu; used by the matrix toolbar. */
export function ChipMenu(props: ChipMenuProps) {
	const { prefix, label, dashed, disabled, className, children } = props;

	return (
		<div className={cn('flex items-center gap-1.5', className)}>
			{prefix ? (
				<span className="text-[0.6875rem] font-semibold leading-[0.875rem] uppercase tracking-wide text-text-menu">
					{prefix}
				</span>
			) : null}
			<DropdownMenu>
				<DropdownMenuTrigger asChild disabled={disabled}>
					<ButtonTw
						variant="outline-secondary"
						size="xss"
						className={cn(dashed && 'border-dashed text-text-menu')}
					>
						{label}
						<Icon name="ChevronDown" size={16} className="ml-1" />
					</ButtonTw>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="min-w-[10rem]">
					{children}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
