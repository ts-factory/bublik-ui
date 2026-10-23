/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useId } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';

import { cn } from '@/shared/tailwind-ui';

import { useFeatureFlag } from './feature-flags.hooks';
import { FeatureFlagDefinition, FeatureFlagId } from './feature-flags.registry';

interface FeatureFlagToggleProps {
	flag: FeatureFlagDefinition & { id: FeatureFlagId };
	className?: string;
}

/** A settings row for one flag: its name and description, and a switch. */
function FeatureFlagToggle({ flag, className }: FeatureFlagToggleProps) {
	const [enabled, setEnabled] = useFeatureFlag(flag.id);
	const id = useId();
	const descriptionId = `${id}-description`;

	return (
		<div
			className={cn(
				'flex items-start justify-between gap-4 rounded-lg border border-border-input px-4 py-3',
				className
			)}
		>
			<div className="flex min-w-0 flex-col gap-1">
				<label
					htmlFor={id}
					className="cursor-pointer text-sm font-semibold text-text-primary"
				>
					{flag.name}
				</label>
				<p id={descriptionId} className="text-xs leading-4 text-text-menu">
					{flag.description}
				</p>
			</div>
			<SwitchPrimitive.Root
				id={id}
				aria-describedby={descriptionId}
				data-testid={`feature-flag-${flag.id}`}
				checked={enabled}
				onCheckedChange={setEnabled}
				className={cn(
					'relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ease-in-out',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
					'rdx-state-checked:bg-primary rdx-state-unchecked:bg-border-primary'
				)}
			>
				<SwitchPrimitive.Thumb
					className={cn(
						'block size-4 translate-x-0.5 rounded-full bg-white shadow transition-transform will-change-transform',
						'rdx-state-checked:translate-x-[18px]'
					)}
				/>
			</SwitchPrimitive.Root>
		</div>
	);
}

export { FeatureFlagToggle };
export type { FeatureFlagToggleProps };
