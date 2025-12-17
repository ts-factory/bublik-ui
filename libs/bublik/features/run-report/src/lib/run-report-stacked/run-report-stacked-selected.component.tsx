/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2025 OKTET LTD */
import { ButtonTw, Icon, Tooltip } from '@/shared/tailwind-ui';
import { AnimatePresence, motion, Transition, Variants } from 'framer-motion';

const variants: Variants = {
	visible: { opacity: 1, y: '0%' },
	hidden: { opacity: 0, y: '100%' },
	exit: { opacity: 0, y: '100%' }
};

const transition: Transition = { bounce: 0.1 };

interface SelectedItem {
	id: string;
	label: string;
}

interface RunReportStackedSelectedProps {
	items?: SelectedItem[];
	onResetClick?: () => void;
	onRemoveClick?: (id: string) => void;
	onOpenClick?: () => void;
}

function RunReportStackedSelected(props: RunReportStackedSelectedProps) {
	const { items = [], onResetClick, onRemoveClick, onOpenClick } = props;

	const isPopoverVisible = items.length;

	return (
		<AnimatePresence>
			{isPopoverVisible ? (
				<motion.div
					variants={variants}
					initial="hidden"
					animate="visible"
					exit="exit"
					transition={transition}
					className="fixed bottom-4 z-50 right-4 bg-white rounded-lg shadow-popover min-w-[360px] max-h-[90vh] flex flex-col"
					layout="size"
				>
					<div className="flex flex-col gap-2 px-4 pt-2 flex-1 overflow-auto">
						<h1 className="text-[0.875rem] leading-[1.125rem] font-semibold mb-2">
							Selected Charts
						</h1>
						<ul className="flex flex-col gap-2 mb-4">
							{items.map((item) => {
								return (
									<li
										key={item.id}
										className="flex items-center gap-2 justify-between p-2 border rounded border-border-primary hover:bg-gray-50"
									>
										<div>
											<span className="text-[0.6875rem] font-medium leading-[0.875rem]">
												{item.label}
											</span>
										</div>
										<Tooltip
											content="Remove from stacked"
											disableHoverableContent
										>
											<button
												aria-label="Remove from stacked"
												className="grid transition-colors rounded place-items-center text-text-unexpected hover:bg-red-100"
												onClick={() => onRemoveClick?.(item.id)}
											>
												<Icon
													name="CrossSimple"
													className="size-5 translate-y-[2px]"
												/>
											</button>
										</Tooltip>
									</li>
								);
							})}
						</ul>
					</div>
					<div className="flex flex-col gap-2 px-4 py-2 mt-2 border-t border-border-primary">
						<div className="flex items-center gap-2">
							<ButtonTw
								variant="primary"
								rounded="lg"
								size="md"
								className="w-full justify-center"
								onClick={onOpenClick}
								disabled={items.length <= 1}
							>
								<Icon name="LineChartMultiple" className="size-6 mr-2" />
								<span>Stacked</span>
							</ButtonTw>
							<ButtonTw
								variant="outline"
								rounded="lg"
								size="md"
								className="w-full justify-center"
								onClick={onResetClick}
							>
								<span>Reset</span>
							</ButtonTw>
						</div>
					</div>
				</motion.div>
			) : null}
		</AnimatePresence>
	);
}

export { RunReportStackedSelected };
