/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';

import { cn } from '../utils';

export interface ToggleSwitchProps extends SwitchPrimitive.SwitchProps {
	label?: string;
}

export const ToggleSwitch = forwardRef<HTMLLabelElement, ToggleSwitchProps>(
	({ label = 'Placeholder', ...props }, ref) => {
		return (
			<label
				htmlFor="toggle-switch"
				className="flex items-center justify-center gap-3 cursor-pointer rounded-md px-3 text-[0.875rem] leading-[1.5rem] font-medium border border-border-primary py-[7px] hover:bg-gray-50 transition-colors select-none"
				ref={ref}
			>
				<SwitchPrimitive.Root
					className={cn(
						'group w-[26px] h-4 rounded-full relative',
						'transition-colors duration-200 ease-in-out',
						'rdx-state-checked:bg-primary',
						'rdx-state-unchecked:bg-border-primary'
					)}
					{...props}
					id="toggle-switch"
				>
					<SwitchPrimitive.Thumb
						className={cn(
							'block w-3 h-3 bg-primary rounded-full',
							'transition-all translate-x-0.5 will-change-transform',
							'rdx-state-checked:translate-x-3 rdx-state-checked:bg-white'
						)}
					/>
				</SwitchPrimitive.Root>
				{label}
			</label>
		);
	}
);
