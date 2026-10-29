/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import type { LucideIcon } from 'lucide-react';

import { cn, DropdownMenuItem, Tooltip } from '@/shared/tailwind-ui';

interface TrayMenuOption<T extends string> {
	value: T;
	label: string;
	icon: LucideIcon;
}

interface TrayMenuItemProps<T extends string> {
	icon: ReactNode;
	label: string;
	itemClassName: string;
	onOpenSettings: () => void;
	ariaLabel: string;
	value: T;
	onValueChange: (value: T) => void;
	options: TrayMenuOption<T>[];
	testIdPrefix: string;
}

/**
 * An account menu entry that opens a settings tab, with a tray of icon
 * buttons at its right end that switches a setting in place. Dressed like the
 * log row's mode switch in the sidebar. The buttons are menu radio items, so
 * arrow keys reach them, and picking one keeps the menu open.
 */
function TrayMenuItem<T extends string>({
	icon,
	label,
	itemClassName,
	onOpenSettings,
	ariaLabel,
	value,
	onValueChange,
	options,
	testIdPrefix
}: TrayMenuItemProps<T>) {
	return (
		<div className="group/tray relative">
			<DropdownMenuItem
				className={cn(itemClassName, 'pr-[92px]')}
				onSelect={onOpenSettings}
			>
				<span className="grid place-items-center size-[18px] shrink-0">
					{icon}
				</span>
				{label}
			</DropdownMenuItem>
			{/* Over the entry's right end, so the entry's highlight spans the
			    row. On that highlight a primary tray would melt in, so it takes
			    the surface colour there, like the log row's. */}
			<DropdownMenuPrimitive.RadioGroup
				aria-label={ariaLabel}
				value={value}
				onValueChange={(next) => onValueChange(next as T)}
				className={cn(
					'absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md bg-primary/10 p-0.5',
					'group-has-[[role=menuitem][data-highlighted]]/tray:bg-bg-primary'
				)}
			>
				{options.map((option) => {
					const OptionIcon = option.icon;

					return (
						<Tooltip
							key={option.value}
							content={option.label}
							side="top"
							delayDuration={400}
						>
							<DropdownMenuPrimitive.RadioItem
								value={option.value}
								aria-label={`${option.label} ${ariaLabel.toLowerCase()}`}
								data-testid={`${testIdPrefix}-${option.value}`}
								onSelect={(event) => event.preventDefault()}
								className={cn(
									'cursor-pointer rounded p-0.5 outline-none transition-colors',
									'rdx-state-checked:bg-primary rdx-state-checked:text-white',
									'rdx-state-unchecked:text-text-menu rdx-state-unchecked:hover:bg-primary-wash rdx-state-unchecked:hover:text-primary',
									'rdx-state-unchecked:data-[highlighted]:bg-primary-wash rdx-state-unchecked:data-[highlighted]:text-primary',
									'focus-visible:ring-2 focus-visible:ring-primary'
								)}
							>
								<OptionIcon className="size-[18px]" strokeWidth={1.75} />
							</DropdownMenuPrimitive.RadioItem>
						</Tooltip>
					);
				})}
			</DropdownMenuPrimitive.RadioGroup>
		</div>
	);
}

export { TrayMenuItem };
export type { TrayMenuOption };
