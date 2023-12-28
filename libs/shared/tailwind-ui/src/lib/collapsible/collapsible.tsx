/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

import { cn } from '../utils';

const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

const CollapsibleContent = forwardRef<
	ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
	ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>
>(({ className, ...props }, ref) => (
	<CollapsiblePrimitive.CollapsibleContent
		className={cn(
			'overflow-hidden rdx-state-open:animate-collapsible-slide-down rdx-state-closed:animate-collapsible-slide-up',
			className
		)}
		{...props}
		ref={ref}
	/>
));

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
