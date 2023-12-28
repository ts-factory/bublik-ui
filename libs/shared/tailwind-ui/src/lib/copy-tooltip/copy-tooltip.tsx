/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	forwardRef,
	useState,
	useImperativeHandle,
	useRef,
	PropsWithChildren
} from 'react';
import { AnimatePresence, motion, Variants } from 'framer-motion';

import { useCopyToClipboard } from '@/shared/hooks';

import { CopyProps, CopyContentHandle } from './types';
import { HoverCard } from '../hover-card';
import { Icon } from '../icon';

const iconVariants: Variants = {
	hidden: { opacity: 0, scale: 0 },
	visible: { opacity: 1, scale: 1, transition: { delay: 0.15 } }
};

export type CopyContentProps = CopyProps;

export const CopyContent = forwardRef<CopyContentHandle, CopyContentProps>(
	({ copyString, onCopyComplete }, ref) => {
		const [isIconVisible, setIsIconVisible] = useState(false);

		const [, copy] = useCopyToClipboard();

		const resetState = () => setIsIconVisible(false);

		useImperativeHandle(ref, () => ({ resetState }), []);

		const handleCopyClick = async () => {
			const isSuccess = await copy(copyString || '');

			setIsIconVisible(true);
			onCopyComplete?.(isSuccess);
		};

		return (
			<motion.button
				layout
				initial="hidden"
				animate="visible"
				onClick={handleCopyClick}
				className="flex items-center gap-1 h-[30px] px-4 bg-white rounded shadow-tooltip hover:text-primary"
			>
				<motion.span
					className="justify-self-start flex-shrink-0 text-[0.6875rem] font-medium leading-[0.875rem]"
					layout
				>
					Copy
				</motion.span>
				<AnimatePresence>
					{isIconVisible && (
						<motion.div
							className="grid place-items-center text-primary"
							layout
							variants={iconVariants}
						>
							<Icon name="InformationCircleCheckmark" size={16} />
						</motion.div>
					)}
				</AnimatePresence>
			</motion.button>
		);
	}
);

export type CopyTooltipProps = CopyProps;

export const CopyTooltip = (props: PropsWithChildren<CopyTooltipProps>) => {
	const { copyString = '', onCopyComplete, children } = props;
	const copyContentRef = useRef<CopyContentHandle>(null);

	const handleHidden = (isOpen: boolean) => {
		if (!isOpen) {
			setTimeout(() => copyContentRef.current?.resetState(), 400);
		}
	};

	return (
		<HoverCard
			openDelay={400}
			closeDelay={200}
			onOpenChange={handleHidden}
			side="top"
			content={
				<CopyContent
					copyString={copyString}
					onCopyComplete={onCopyComplete}
					ref={copyContentRef}
				/>
			}
			arrow
		>
			{children}
		</HoverCard>
	);
};
