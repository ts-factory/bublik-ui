/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/shared/tailwind-ui';

interface RadioCardProps {
	value: string;
	id: string;
	label: string;
	description: ReactNode;
	icon: LucideIcon;
	isActive: boolean;
	/** A miniature of what picking the card gives */
	preview: ReactNode;
}

/** One option of a settings radio group: a titled card with a preview */
function RadioCard({
	value,
	id,
	label,
	description,
	icon: OptionIcon,
	isActive,
	preview
}: RadioCardProps) {
	return (
		<RadioGroupPrimitive.Item
			value={value}
			id={id}
			aria-label={label}
			className={cn(
				'flex flex-col overflow-hidden rounded-lg border text-left transition-colors',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
				isActive
					? 'border-primary'
					: 'border-border-input hover:border-primary/60'
			)}
		>
			<div
				className={cn(
					'flex items-center gap-2 border-b px-3 py-2',
					isActive ? 'border-primary bg-primary-wash' : 'border-border-primary'
				)}
			>
				<OptionIcon
					className="size-4 shrink-0 text-text-menu"
					strokeWidth={1.6}
				/>
				<span className="text-sm font-semibold text-text-primary">{label}</span>
				{isActive ? (
					<span className="ml-auto rounded-full border border-primary px-2 text-xs font-medium leading-5 text-primary">
						Active
					</span>
				) : null}
			</div>
			<div className="flex flex-1 flex-col gap-2 p-3">
				<p className="text-xs leading-4 text-text-menu">{description}</p>
				<div className="mt-auto overflow-hidden rounded-md border border-border-primary">
					{preview}
				</div>
			</div>
		</RadioGroupPrimitive.Item>
	);
}

export { RadioCard };
