/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2025 OKTET LTD */
import {
	ButtonTw,
	Icon,
	Tooltip,
	SelectionPopover,
	SelectionPopoverBody,
	SelectionPopoverFooter,
	SelectionPopoverList,
	SelectionPopoverTitle,
	SelectionPopoverFloatingButton,
	useSelectionPopoverOpenState
} from '@/shared/tailwind-ui';

import { RUN_REPORT_STACKED_SELECTED_STORAGE_KEY } from './run-report-stacked.constants';

const pluralRules = new Intl.PluralRules('en-US');
const suffixes = {
	one: '',
	other: 's'
} as const satisfies Record<'one' | 'other', string>;

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

	const hasItems = items.length > 0;
	const { open, onOpenChange, resetOpenState } = useSelectionPopoverOpenState(
		RUN_REPORT_STACKED_SELECTED_STORAGE_KEY
	);

	if (!hasItems) return null;
	const count = items.length;
	const rule = pluralRules.select(count) as 'one' | 'other';
	const label = `${count} chart${suffixes[rule]} selected`;
	const handleResetClick = () => {
		resetOpenState();
		onResetClick?.();
	};
	const handleRemoveClick = (id: string) => {
		if (items.length === 1) {
			resetOpenState();
		}
		onRemoveClick?.(id);
	};

	return (
		<SelectionPopover open={open} onOpenChange={onOpenChange} layout="size">
			<SelectionPopoverFloatingButton
				label={label}
				icon="ExpandSelection"
				disabled={!hasItems}
			/>
			<SelectionPopoverBody>
				<SelectionPopoverTitle>Selected Charts</SelectionPopoverTitle>
				<SelectionPopoverList>
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
								<Tooltip content="Remove from stacked" disableHoverableContent>
									<button
										aria-label="Remove from stacked"
										className="grid transition-colors rounded place-items-center text-text-unexpected hover:bg-red-100"
										onClick={() => handleRemoveClick(item.id)}
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
				</SelectionPopoverList>
			</SelectionPopoverBody>
			<SelectionPopoverFooter>
				<div className="flex items-center gap-2">
					<ButtonTw
						variant="primary"
						rounded="lg"
						size="sm/2"
						className="w-full justify-center"
						onClick={onOpenClick}
						disabled={items.length <= 1}
					>
						<Icon name="LineChartMultiple" className="size-5 mr-2" />
						<span>Stacked</span>
					</ButtonTw>
					<ButtonTw
						variant="outline"
						rounded="lg"
						size="sm/2"
						className="w-full justify-center"
						onClick={handleResetClick}
					>
						<span>Reset</span>
					</ButtonTw>
				</div>
			</SelectionPopoverFooter>
		</SelectionPopover>
	);
}

export { RunReportStackedSelected };
