/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentPropsWithRef, forwardRef, RefObject } from 'react';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { cn } from '../utils';

import { useScrollToTopPage } from '@/shared/hooks';

import { Icon } from '../icon';

const variants: Variants = {
	visible: { y: 0, opacity: 1 },
	hidden: { y: 72, opacity: 0 }
};

export interface ScrollToTopProps extends ComponentPropsWithRef<'button'> {
	offset?: number;
	containerRef?: RefObject<HTMLElement>;
	className?: string;
}

export const ScrollToTop = forwardRef<HTMLButtonElement, ScrollToTopProps>(
	({ offset = 0, containerRef, className = '', ...props }, ref) => {
		const { isVisible, scroll, isScrollingUp } = useScrollToTopPage(
			offset,
			containerRef
		);

		return (
			<AnimatePresence>
				{isVisible && (
					<motion.div
						variants={variants}
						initial="hidden"
						animate="visible"
						exit="hidden"
						transition={{ type: 'just' }}
						className={cn('absolute z-40', className)}
					>
						<button
							className="flex items-center gap-1 p-3 text-white rounded-full bg-primary transition-all text-[1rem] font-medium leading-[0.875rem] border-2 border-transparent hover:border-[#94b0ff]"
							onClick={scroll}
							data-testid="scroll-to-top"
							aria-label={isScrollingUp ? 'Scroll to bottom' : 'Scroll to top'}
							ref={ref}
							{...props}
						>
							<Icon
								name="ArrowShortTop"
								className={cn(
									'grid place-items-center transition-transform duration-200',
									!isScrollingUp && 'rotate-180'
								)}
							/>
						</button>
					</motion.div>
				)}
			</AnimatePresence>
		);
	}
);

export const ScrollToTopPage = forwardRef<HTMLButtonElement, ScrollToTopProps>(
	({ offset = 0, ...props }, ref) => {
		return (
			<ScrollToTop ref={ref} offset={offset} className="fixed" {...props} />
		);
	}
);
