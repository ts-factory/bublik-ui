/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, Transition, Variants } from 'framer-motion';

import { RUN_STATUS } from '@/shared/types';
import {
	ButtonTw,
	getRunStatusInfo,
	Tooltip,
	Icon
} from '@/shared/tailwind-ui';

const variants: Variants = {
	visible: { opacity: 1, y: '0%' },
	hidden: { opacity: 0, y: '100%' },
	exit: { opacity: 0, y: '100%' }
};

const transition: Transition = { bounce: 0.1 };

export interface SelectionPopoverComponentProps {
	compareIds: string[];
	renderItem: (runId: string) => ReactNode;
	onResetClick: () => void;
}

export const SelectionPopover: FC<SelectionPopoverComponentProps> = (props) => {
	const { compareIds, renderItem, onResetClick } = props;

	const isPopoverVisible = compareIds.length;

	return (
		<AnimatePresence>
			{isPopoverVisible ? (
				<motion.div
					variants={variants}
					initial="hidden"
					animate="visible"
					exit="exit"
					transition={transition}
					className="fixed bottom-4 right-4 bg-white rounded-lg shadow-popover min-w-[360px] max-h-[90vh] flex flex-col"
					layout="size"
				>
					<div className="flex flex-col gap-2 px-4 pt-2 flex-1 overflow-auto">
						<SelectedResultList
							label="Selection"
							ids={compareIds}
							renderItem={renderItem}
						/>
					</div>
					<div className="flex flex-col gap-2 px-4 py-2 mt-2 border-t border-border-primary">
						<div className="flex items-center gap-2">
							{compareIds.length >= 2 ? (
								<Link
									className="w-full relative inline-flex items-center justify-center transition-all appearance-none select-none whitespace-nowrap text-white bg-primary py-1 px-3 text-[0.875rem] font-medium leading-[1.5rem] rounded-lg border-[3px] border-transparent gap-2 hover:border-[#94b0ff]"
									to={{
										pathname: '/multiple',
										search: new URLSearchParams(
											compareIds.map((s) => ['runIds', s])
										).toString()
									}}
								>
									<Icon name="PaperStack" className="size-5 mr-2" />
									Multiple
								</Link>
							) : (
								<ButtonTw
									variant="primary"
									rounded="lg"
									size="md"
									className="w-full justify-center"
									disabled={compareIds.length !== 2}
								>
									<Icon name="PaperStack" className="size-5 mr-2" />
									<span>Multiple</span>
								</ButtonTw>
							)}
							{compareIds.length === 2 ? (
								<Link
									className="w-full relative inline-flex items-center justify-center transition-all appearance-none select-none whitespace-nowrap text-white bg-primary py-1 px-3 text-[0.875rem] font-medium leading-[1.5rem] rounded-lg border-[3px] border-transparent gap-2 hover:border-[#94b0ff]"
									to={{
										pathname: '/compare',
										search: `left=${compareIds[0]}&right=${compareIds[1]}`
									}}
								>
									Compare
									<Icon
										name="SwapArrows"
										size={20}
										className="text-white rotate-90"
									/>
								</Link>
							) : (
								<ButtonTw
									variant="primary"
									rounded="lg"
									size="md"
									className="w-full justify-center"
									disabled={compareIds.length !== 2}
								>
									<Icon
										name="SwapArrows"
										size={20}
										className="rotate-90 mr-2"
									/>
									<span>Compare</span>
								</ButtonTw>
							)}
						</div>
						<ButtonTw
							variant="outline"
							rounded="lg"
							size="md"
							className="w-full justify-center"
							onClick={onResetClick}
						>
							Reset
						</ButtonTw>
					</div>
				</motion.div>
			) : null}
		</AnimatePresence>
	);
};

export interface SelectedResultListProps {
	label: string;
	ids: string[];
	renderItem: (runId: string) => ReactNode;
}

export const SelectedResultList: FC<SelectedResultListProps> = ({
	ids,
	label,
	renderItem
}) => {
	return (
		<div className="flex flex-col gap-2">
			<span className="text-[0.875rem] leading-[1.125rem] font-semibold">
				{label}
			</span>
			<ul className="flex flex-col gap-2">
				{ids.map((id) => (
					<li key={id}>{renderItem(id)}</li>
				))}
			</ul>
		</div>
	);
};

export interface SelectedResultItemProps {
	name: string;
	status: RUN_STATUS;
	start?: string | null;
	onRemoveClick?: () => void;
}

export const SelectedResultItem: FC<SelectedResultItemProps> = (props) => {
	const { name, status, start, onRemoveClick } = props;
	const { bg, icon, color } = getRunStatusInfo(status);

	return (
		<div className="flex flex-col rounded">
			<div className="flex">
				<Tooltip
					content={`Conclusion: ${status.replace('run-', '')}`}
					disableHoverableContent
				>
					<div
						className={`${color} ${bg} rounded-l grid place-items-center px-0.5`}
					>
						{icon}
					</div>
				</Tooltip>

				<div className="flex items-center justify-between flex-grow gap-2 py-2 pl-1 pr-1.5 border-r rounded-r border-y">
					<div className="grid grid-cols-[36px,8px,1fr] gap-y-2">
						<span className="col-start-1 row-1 text-[0.6875rem] font-medium leading-[0.875rem] text-text-menu">
							Name:
						</span>
						<span className="col-start-3 row-1 text-[0.6875rem] font-medium leading-[0.875rem]">
							{name}
						</span>
						<span className="col-start-1 row-2 text-[0.6875rem] font-medium leading-[0.875rem] text-text-menu">
							Start:
						</span>
						<span className="text-[0.6875rem] col-start-3 row-2 font-medium leading-[0.875rem]">
							{start}
						</span>
					</div>
					<div className="flex gap-2">
						<Tooltip content="Remove from compare" disableHoverableContent>
							<button
								aria-label="Remove from compare"
								className="grid transition-colors rounded place-items-center text-text-unexpected hover:bg-red-100"
								onClick={onRemoveClick}
							>
								<Icon name="CrossSimple" />
							</button>
						</Tooltip>
					</div>
				</div>
			</div>
		</div>
	);
};
