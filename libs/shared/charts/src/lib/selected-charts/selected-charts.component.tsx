/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
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
	selectionCount: number;
	plots: { plot: SingleMeasurementChart; color: string }[];
	onResetButtonClick?: () => void;
	onRemoveClick?: (plot: SingleMeasurementChart) => void;
	onOpenButtonClick?: () => void;
}

function SelectedChartsPopover(props: SelectedChartsPopoverProps) {
	const hasSelection = props.selectionCount > 0;

	if (!hasSelection) return null;

	return (
		<SelectionPopover defaultOpen className="z-30">
			<SelectionPopoverFloatingButton
				label={props.label}
				icon="ExpandSelection"
				disabled={!hasSelection}
			/>
			<SelectionPopoverBody>
				<SelectionPopoverTitle>Selected Charts</SelectionPopoverTitle>
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
						rounded="lg"
						size="sm/2"
						className="flex-1"
						onClick={props.onOpenButtonClick}
					>
						<Icon name="LineChartMultiple" className="size-5 mr-2" />
						<span>Stacked</span>
					</ButtonTw>
					<ButtonTw
						variant="outline"
						size="sm/2"
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
