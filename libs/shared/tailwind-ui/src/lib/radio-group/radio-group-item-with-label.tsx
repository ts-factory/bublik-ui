import * as React from 'react';

import { RadioGroupItem } from './radio-group.component';
import { cn } from '../utils';

export interface RadioGroupItemWithLabelProps {
	id: string;
	value: string;
	label: string;
	description?: string;
	className?: string;
}

export const RadioGroupItemWithLabel = React.forwardRef<
	React.ElementRef<typeof RadioGroupItem>,
	RadioGroupItemWithLabelProps
>(({ id, value, label, description, className, ...props }, ref) => {
	return (
		<div className={cn('flex flex-col gap-1', className)}>
			<div className="flex items-center gap-2">
				<RadioGroupItem
					id={id}
					value={value}
					ref={ref}
					className="peer"
					{...props}
				/>
				<label
					htmlFor={id}
					className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					{label}
				</label>
			</div>
			{description && (
				<p className="text-xs text-text-menu ml-6">{description}</p>
			)}
		</div>
	);
});
RadioGroupItemWithLabel.displayName = 'RadioGroupItemWithLabel';
