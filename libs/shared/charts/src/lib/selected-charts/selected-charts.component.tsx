/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { AnimatePresence, motion, Transition, Variants } from 'framer-motion';

import { ButtonTw, Icon, Tooltip } from '@/shared/tailwind-ui';
import { SingleMeasurementChart } from '@/services/bublik-api';
import { getChartName } from '../utils';

const variants: Variants = {
	visible: { opacity: 1, y: '0%' },
	hidden: { opacity: 0, y: '100%' },
	exit: { opacity: 0, y: '100%' }
};

const transition: Transition = { bounce: 0.1 };

interface SelectedChartsPopoverProps {
	label: string;
	open: boolean;
	plots: { plot: SingleMeasurementChart; color: string }[];
	onResetButtonClick?: () => void;
	onRemoveClick?: (plot: SingleMeasurementChart) => void;
	onOpenButtonClick?: () => void;
}

function SelectedChartsPopover(props: SelectedChartsPopoverProps) {
	return (
		<AnimatePresence>
			{props.open ? (
				<motion.div
					variants={variants}
					initial="hidden"
					animate="visible"
					exit="exit"
					transition={transition}
					className="fixed bottom-4 right-4 bg-white rounded-lg shadow-popover min-w-[360px] px-4 py-2 z-30"
				>
					<h1 className="text-[0.875rem] leading-[1.125rem] font-semibold mb-2">
						{props.label}
					</h1>
					<ul className="flex flex-col gap-2 mb-4">
						{props.plots.map(({ plot }) => {
							return (
								<li
									key={plot.id}
									className="flex items-center justify-between p-2 border rounded border-border-primary hover:bg-gray-50"
								>
									<div>
										<span className="text-[0.6875rem] font-medium leading-[0.875rem]">
											{getChartName(plot)}
										</span>
									</div>
									<Tooltip
										content="Remove from combined chart"
										disableHoverableContent
									>
										<button
											aria-label="Remove from compare"
											className="grid transition-colors rounded place-items-center text-text-unexpected hover:bg-red-100"
											onClick={() => props.onRemoveClick?.(plot)}
										>
											<Icon name="CrossSimple" />
										</button>
									</Tooltip>
								</li>
							);
						})}
					</ul>
					<div className="flex items-center gap-2">
						<ButtonTw
							variant="primary"
							size="md"
							rounded="lg"
							className="flex-1"
							onClick={props.onOpenButtonClick}
						>
							Open
						</ButtonTw>
						<ButtonTw
							variant="outline"
							size="md"
							rounded="lg"
							className="flex-1"
							onClick={props.onResetButtonClick}
						>
							Reset
						</ButtonTw>
					</div>
				</motion.div>
			) : null}
		</AnimatePresence>
	);
}

export { SelectedChartsPopover };
