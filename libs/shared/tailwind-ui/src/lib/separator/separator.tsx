/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';

import { cn } from '../utils';

export const Separator = React.forwardRef<
	React.ElementRef<typeof SeparatorPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
	(
		{ className, orientation = 'horizontal', decorative = true, ...props },
		ref
	) => (
		<SeparatorPrimitive.Root
			ref={ref}
			decorative={decorative}
			orientation={orientation}
			className={cn(
				'shrink-0 bg-border-primary',
				orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-px',
				className
			)}
			{...props}
		/>
	)
);
Separator.displayName = SeparatorPrimitive.Root.displayName;
