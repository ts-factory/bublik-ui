/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';

import { cn } from '../utils';

type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>;

/** An on/off switch; label it with a `<label htmlFor>` or `aria-label`. */
const Switch = React.forwardRef<
	React.ElementRef<typeof SwitchPrimitive.Root>,
	SwitchProps
>(({ className, ...props }, ref) => (
	<SwitchPrimitive.Root
		ref={ref}
		className={cn(
			'relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out',
			'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
			'rdx-state-checked:bg-primary rdx-state-unchecked:bg-border-primary',
			'disabled:cursor-not-allowed disabled:opacity-50',
			className
		)}
		data-slot="switch"
		{...props}
	>
		{/* White on both tracks and in both themes, like the Beta switches. */}
		<SwitchPrimitive.Thumb
			className={cn(
				'block size-4 translate-x-0.5 rounded-full bg-white shadow transition-transform will-change-transform',
				'rdx-state-checked:translate-x-[18px]'
			)}
		/>
	</SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
export type { SwitchProps };
