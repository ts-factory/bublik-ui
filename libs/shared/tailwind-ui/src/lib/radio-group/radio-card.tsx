/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import { cn } from '../utils';

interface RadioCardProps
	extends Omit<
		React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
		'children' | 'title'
	> {
	title: string;
	/** One line under the title; it becomes the radio's description. */
	description?: string;
	/** A small picture of the choice, drawn above the title. */
	preview?: React.ReactNode;
}

/**
 * One option of a `RadioGroup`, drawn as a card that is a radio as a whole.
 * It keeps the group's roving focus and arrow keys; its accessible name is
 * the title alone, so a description never changes how it is found.
 */
const RadioCard = React.forwardRef<
	React.ElementRef<typeof RadioGroupPrimitive.Item>,
	RadioCardProps
>(({ title, description, preview, className, ...props }, ref) => {
	const id = React.useId();
	const titleId = `${id}-title`;
	const descriptionId = `${id}-description`;

	return (
		<RadioGroupPrimitive.Item
			ref={ref}
			aria-labelledby={titleId}
			aria-describedby={description ? descriptionId : undefined}
			className={cn(
				'group flex flex-col gap-3 rounded-lg border p-3 text-left transition-colors',
				'border-border-input bg-bg-primary hover:border-primary/60',
				'rdx-state-checked:border-primary rdx-state-checked:bg-primary-wash rdx-state-checked:ring-1 rdx-state-checked:ring-primary',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
				'disabled:cursor-not-allowed disabled:opacity-50',
				className
			)}
			data-slot="radio-card"
			{...props}
		>
			{preview ? (
				<span aria-hidden className="block w-full">
					{preview}
				</span>
			) : null}
			<span className="flex w-full items-start gap-2">
				<span className="flex min-w-0 flex-1 flex-col gap-1">
					<span
						id={titleId}
						className="text-sm font-semibold leading-5 text-text-primary"
					>
						{title}
					</span>
					{description ? (
						<span
							id={descriptionId}
							className="text-xs leading-4 text-text-menu"
						>
							{description}
						</span>
					) : null}
				</span>
				<span
					aria-hidden
					className={cn(
						'mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border transition-colors',
						'border-border-input group-rdx-state-checked:border-primary'
					)}
				>
					<span className="size-2 scale-0 rounded-full bg-primary transition-transform group-rdx-state-checked:scale-100" />
				</span>
			</span>
		</RadioGroupPrimitive.Item>
	);
});
RadioCard.displayName = 'RadioCard';

export { RadioCard };
export type { RadioCardProps };
