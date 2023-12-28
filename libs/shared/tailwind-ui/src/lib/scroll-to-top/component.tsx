/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentPropsWithRef, FC, forwardRef } from 'react';
import { AnimatePresence, motion, Variants } from 'framer-motion';

import { useScrollToTopPage } from '@/shared/hooks';

import { Icon } from '../icon';

const variants: Variants = {
	visible: { y: 0, opacity: 1 },
	hidden: { y: 72, opacity: 0 }
};

export interface ScrollToTopProps extends ComponentPropsWithRef<'button'> {
	offset?: number;
}

export const ScrollToTopPage: FC<ScrollToTopProps> = forwardRef(
	({ offset = 0 }, ref) => {
		const { isVisible, scrollToTop } = useScrollToTopPage(offset);

		return (
			<AnimatePresence>
				{isVisible && (
					<motion.div
						variants={variants}
						initial="hidden"
						animate="visible"
						exit="hidden"
						transition={{ type: 'just' }}
						className="fixed z-40 bottom-4 right-4"
					>
						<button
							className="flex items-center gap-1 p-3 text-white rounded-full bg-primary transition-all text-[1rem] font-medium leading-[0.875rem] border-2 border-transparent hover:border-[#94b0ff]"
							onClick={scrollToTop}
							data-testid="scroll-to-top"
							aria-label="Scroll to top"
							ref={ref}
						>
							<Icon name="ArrowShortTop" className="grid place-items-center" />
						</button>
					</motion.div>
				)}
			</AnimatePresence>
		);
	}
);
