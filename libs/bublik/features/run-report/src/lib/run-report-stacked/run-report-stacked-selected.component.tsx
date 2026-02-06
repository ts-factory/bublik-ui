/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2025 OKTET LTD */
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
	const [isOpen, setIsOpen] = useState(hasItems);
	const [hasEverSelected, setHasEverSelected] = useState(hasItems);
	const prevCountRef = useRef(items.length);

	useEffect(() => {
		const wasEmpty = prevCountRef.current === 0;
		if (items.length === 0) {
			setIsOpen(false);
		} else if (wasEmpty) {
			setIsOpen(true);
			setHasEverSelected(true);
		}
		if (items.length > 0) setHasEverSelected(true);
		prevCountRef.current = items.length;
	}, [items.length]);

	return (
		<SelectionPopover
			open={isOpen && hasItems}
			onOpenChange={setIsOpen}
			layout="size"
		>
			{hasEverSelected ? (
				<SelectionPopoverFloatingButton
					label="Selected Charts"
					icon="ExpandSelection"
					disabled={!hasItems}
				/>
			) : null}
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
				</SelectionPopoverList>
			</SelectionPopoverBody>
			<SelectionPopoverFooter>
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
			</SelectionPopoverFooter>
		</SelectionPopover>
	);
}

export { RunReportStackedSelected };
