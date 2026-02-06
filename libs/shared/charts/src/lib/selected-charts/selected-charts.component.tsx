/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect, useRef, useState } from 'react';

import {
	ButtonTw,
	Icon,
	Tooltip,
	SelectionPopover,
	SelectionPopoverBody,
	SelectionPopoverFooter,
	SelectionPopoverList,
	SelectionPopoverTitle,
	SelectionPopoverFloatingButton
} from '@/shared/tailwind-ui';
import { SingleMeasurementChart } from '@/services/bublik-api';
import { getChartName } from '../utils';

interface SelectedChartsPopoverProps {
	label: string;
	open: boolean;
	plots: { plot: SingleMeasurementChart; color: string }[];
	onResetButtonClick?: () => void;
	onRemoveClick?: (plot: SingleMeasurementChart) => void;
	onOpenButtonClick?: () => void;
}

function SelectedChartsPopover(props: SelectedChartsPopoverProps) {
	const hasSelection = props.plots.length > 0;
	const [isOpen, setIsOpen] = useState(hasSelection);
	const [hasEverSelected, setHasEverSelected] = useState(hasSelection);
	const prevCountRef = useRef(props.plots.length);

	useEffect(() => {
		const wasEmpty = prevCountRef.current === 0;
		if (props.plots.length === 0) {
			setIsOpen(false);
		} else if (wasEmpty) {
			setIsOpen(true);
			setHasEverSelected(true);
		}
		if (props.plots.length > 0) setHasEverSelected(true);
		prevCountRef.current = props.plots.length;
	}, [props.plots.length]);

	return (
		<SelectionPopover
			open={isOpen && hasSelection}
			onOpenChange={setIsOpen}
			className="z-30"
		>
			{hasEverSelected ? (
				<SelectionPopoverFloatingButton
					label={props.label}
					icon="ExpandSelection"
					disabled={!hasSelection}
				/>
			) : null}
			<SelectionPopoverBody>
				<SelectionPopoverTitle>{props.label}</SelectionPopoverTitle>
				<SelectionPopoverList>
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
				</SelectionPopoverList>
			</SelectionPopoverBody>
			<SelectionPopoverFooter className="mt-0 border-0 px-4 pb-2 pt-0">
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
			</SelectionPopoverFooter>
		</SelectionPopover>
	);
}

export { SelectedChartsPopover };
