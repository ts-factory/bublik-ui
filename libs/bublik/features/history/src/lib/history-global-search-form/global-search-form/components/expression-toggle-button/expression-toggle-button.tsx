/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { MouseEventHandler } from 'react';

import { cn, cva, Icon, Tooltip } from '@/shared/tailwind-ui';

const buttonStyles = cva({
	base: [
		'inline-flex h-10 w-10 shrink-0 items-center justify-center',
		'rounded-md border border-border-primary',
		'text-text-menu',
		'transition-colors',
		'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20'
	],
	variants: {
		state: {
			default: [
				'hover:bg-primary-wash hover:text-primary hover:border-primary'
			],
			active: [
				'bg-primary text-white border-primary',
				'hover:bg-primary hover:text-white hover:border-primary'
			]
		}
	},
	defaultVariants: {
		state: 'default'
	}
});

const iconWrapperStyles = cva({
	base: ['inline-flex items-center justify-center transition-transform'],
	variants: {
		direction: {
			down: 'rotate-180',
			up: ''
		}
	},
	defaultVariants: {
		direction: 'up'
	}
});

interface ExpressionToggleButtonProps {
	label: string;
	isOpen: boolean;
	onClick: MouseEventHandler<HTMLButtonElement>;
	className?: string;
}

function ExpressionToggleButton(props: ExpressionToggleButtonProps) {
	const { label, isOpen, onClick, className } = props;
	const helpMessage = isOpen ? `Hide ${label}` : `Show ${label}`;

	return (
		<Tooltip content={helpMessage}>
			<button
				className={cn(
					buttonStyles({ state: isOpen ? 'active' : 'default' }),
					className
				)}
				onClick={onClick}
				type="button"
			>
				<span
					className={iconWrapperStyles({ direction: isOpen ? 'up' : 'down' })}
				>
					<Icon name="ArrowShortTop" size={20} />
				</span>
			</button>
		</Tooltip>
	);
}

export { ExpressionToggleButton, type ExpressionToggleButtonProps };
