/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ReactNode } from 'react';

import { ToggleGroupItem, ToggleGroupRoot } from '../toggle-group';
import { Tooltip } from '../tooltip';
import { cn } from '../utils';

export interface SegmentedTabItem<T extends string> {
	value: T;
	label: ReactNode;
	tooltip?: string;
	disabled?: boolean;
}

export interface SegmentedTabsProps<T extends string> {
	value: T;
	onChange: (value: T) => void;
	items: SegmentedTabItem<T>[];
	'aria-label': string;
	className?: string;
}

/**
 * Single-select mode switch: labelled tabs on a tinted tray, the active one
 * filled, coloured like the sidebar's layout switch of the Log item.
 * Re-clicking the active item keeps it selected.
 */
export function SegmentedTabs<T extends string>(props: SegmentedTabsProps<T>) {
	const { value, onChange, items, className } = props;

	return (
		<ToggleGroupRoot
			type="single"
			value={value}
			onValueChange={(next) => {
				// Radix reports '' when the active item is clicked again.
				if (next) onChange(next as T);
			}}
			aria-label={props['aria-label']}
			className={cn(
				'flex w-fit shrink-0 items-center gap-0.5 rounded-md bg-primary/10 p-0.5',
				className
			)}
		>
			{items.map((item) => {
				const tab = (
					<ToggleGroupItem
						value={item.value}
						disabled={item.disabled}
						className={cn(
							'flex h-6 items-center whitespace-nowrap rounded px-2 text-xs font-medium transition-colors',
							'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
							'disabled:cursor-not-allowed disabled:opacity-50',
							value === item.value
								? 'bg-primary text-white'
								: 'text-primary enabled:hover:bg-primary-wash'
						)}
					>
						{item.label}
					</ToggleGroupItem>
				);

				return item.tooltip ? (
					<Tooltip key={item.value} content={item.tooltip}>
						{/* A disabled button fires no pointer events, so the tooltip
						    hangs on a wrapper. */}
						<span className="flex">{tab}</span>
					</Tooltip>
				) : (
					<span key={item.value} className="flex">
						{tab}
					</span>
				);
			})}
		</ToggleGroupRoot>
	);
}
