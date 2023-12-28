/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { useIsOnline } from '@/shared/hooks';

import { Icon } from '../icon';

export interface ConnectionStatusProps {
	isOnline?: boolean;
}

export const ConnectionStatus: FC<ConnectionStatusProps> = ({ isOnline }) => {
	const [isDissmissed, setIsDissmissed] = useState(false);

	const handleDismissClick = () => setIsDissmissed(true);

	const isShown = !isOnline && !isDissmissed;

	return (
		<AnimatePresence>
			{isShown && (
				<motion.div
					className="fixed top-0 z-[9999] w-full bg-bg-error rounded-b flex items-center justify-center [&>*]:p-3"
					initial={{ y: -100 }}
					animate={{ y: 0 }}
					exit={{ y: -100 }}
					transition={{ bounce: 10 }}
					data-testid="tw-connection-status"
				>
					<div className="flex items-center justify-center gap-2 basis-full">
						<Icon
							name="TriangleExclamationMark"
							size={24}
							className="text-white"
						/>
						<span className="text-[18px] font-medium leading-[22px] text-white">
							Connection Lost. Please check your Internet connection
						</span>
					</div>
					<button
						onClick={handleDismissClick}
						aria-label="Dismiss connection banner"
						className="text-white"
					>
						<Icon name="CrossSimple" size={20} />
					</button>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export const ConnectionStatusProvider: FC = () => {
	const isOnline = useIsOnline();

	return <ConnectionStatus isOnline={isOnline} />;
};
