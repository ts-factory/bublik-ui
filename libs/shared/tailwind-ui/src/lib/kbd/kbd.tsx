/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '../utils';

type KbdProps = ComponentPropsWithoutRef<'kbd'>;

const Kbd = forwardRef<HTMLElement, KbdProps>(
	({ className, children, ...props }, ref) => {
		return (
			<kbd
				className={cn(
					'inline-flex h-4 min-w-4 items-center justify-center rounded border border-current/30 bg-white/80 px-1 font-mono text-[0.625rem] text-text-secondary font-semibold leading-none shadow-[inset_0_-1px_0_rgba(0,0,0,0.12)]',
					className
				)}
				ref={ref}
				{...props}
			>
				{children}
			</kbd>
		);
	}
);

Kbd.displayName = 'Kbd';

export { Kbd };
export type { KbdProps };
