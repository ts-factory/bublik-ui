/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { Fragment, ReactNode } from 'react';

import {
	ButtonTw,
	Separator,
	ToggleGroupItem,
	ToggleGroupRoot,
	Tooltip,
	cn
} from '@/shared/tailwind-ui';

// Disabled ButtonTw draws a 1px inset ring on all sides. For joined items,
// drop the ring on shared edges so the separators are the only lines there.
// Kept as literal strings so Tailwind can pick the classes up.
const DISABLED_RING_START_ITEM =
	'disabled:shadow-[inset_1px_0_0_0_hsl(var(--colors-border-primary)),inset_0_1px_0_0_hsl(var(--colors-border-primary)),inset_0_-1px_0_0_hsl(var(--colors-border-primary))]';
const DISABLED_RING_MIDDLE_ITEM =
	'disabled:shadow-[inset_0_1px_0_0_hsl(var(--colors-border-primary)),inset_0_-1px_0_0_hsl(var(--colors-border-primary))]';
const DISABLED_RING_END_ITEM =
	'disabled:shadow-[inset_-1px_0_0_0_hsl(var(--colors-border-primary)),inset_0_1px_0_0_hsl(var(--colors-border-primary)),inset_0_-1px_0_0_hsl(var(--colors-border-primary))]';

export interface JoinedToggleItem<T extends string> {
	value: T;
	label: ReactNode;
	tooltip?: string;
	disabled?: boolean;
	className?: string;
}

export interface JoinedToggleGroupProps<T extends string> {
	value: T;
	onChange: (value: T) => void;
	items: JoinedToggleItem<T>[];
	'aria-label': string;
	disabled?: boolean;
	className?: string;
}

/**
 * Single-select toggle group rendered as joined `ButtonTw`s with separators,
 * the same recipe as the run table's NOK toggle. Re-clicking the active
 * item keeps it selected.
 */
export function JoinedToggleGroup<T extends string>(
	props: JoinedToggleGroupProps<T>
) {
	const { value, onChange, items, disabled, className } = props;

	return (
		<ToggleGroupRoot
			type="single"
			value={value}
			onValueChange={(next) => {
				// Radix reports '' when the active item is clicked again.
				if (next) onChange(next as T);
			}}
			disabled={disabled}
			aria-label={props['aria-label']}
			className={cn('flex items-stretch', className)}
		>
			{items.map((item, idx) => {
				const isFirst = idx === 0;
				const isLast = idx === items.length - 1;
				const ring = isFirst
					? DISABLED_RING_START_ITEM
					: isLast
					? DISABLED_RING_END_ITEM
					: DISABLED_RING_MIDDLE_ITEM;
				const button = (
					<ToggleGroupItem value={item.value} asChild disabled={item.disabled}>
						<ButtonTw
							variant="secondary"
							size="xss"
							state={value === item.value ? 'active' : 'default'}
							className={cn(
								isFirst && !isLast && 'rounded-r-none',
								!isFirst && !isLast && 'rounded-none',
								isLast && !isFirst && 'rounded-l-none',
								ring,
								item.className
							)}
						>
							{item.label}
						</ButtonTw>
					</ToggleGroupItem>
				);

				return (
					<Fragment key={item.value}>
						{idx > 0 ? (
							<Separator orientation="vertical" className="h-auto" />
						) : null}
						{item.tooltip ? (
							<Tooltip content={item.tooltip}>{button}</Tooltip>
						) : (
							button
						)}
					</Fragment>
				);
			})}
		</ToggleGroupRoot>
	);
}
