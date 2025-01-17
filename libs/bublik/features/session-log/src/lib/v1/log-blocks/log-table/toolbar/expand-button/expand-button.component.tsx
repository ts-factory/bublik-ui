/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { ComponentPropsWithoutRef } from 'react';

import { Icon } from '@/shared/tailwind-ui';
import { cn } from '@/shared/tailwind-ui';

type FloatingExpandButtonProps = ComponentPropsWithoutRef<'button'> & {
	isOpen: boolean;
	isIntersection: boolean;
};

function FloatingExpandButton({
	isOpen,
	className,
	isIntersection,
	...props
}: FloatingExpandButtonProps) {
	return (
		<div
			className={cn(
				'rounded-b-xl flex absolute left-1/2 -translate-x-1/2 -bottom-6 shadow-xl items-center justify-center transition-all w-[250px] border-t',
				isOpen
					? 'bg-white text-primary hover:bg-primary-wash border-t-border-primary'
					: 'bg-primary text-white border-t-transparent',
				!isIntersection
					? 'invisible opacity-0 pointer-events-none'
					: 'opacity-100',
				className
			)}
		>
			<button
				{...props}
				className={cn(
					'flex items-center justify-center flex-1 p-0.5 rounded-md'
				)}
			>
				<Icon
					name="ArrowShortTop"
					size={20}
					className={cn('transition-all', isOpen ? 'rotate-0' : 'rotate-180')}
				/>
			</button>
		</div>
	);
}

export { FloatingExpandButton };
