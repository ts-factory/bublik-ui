/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { ButtonTw, Icon, Tooltip } from '@/shared/tailwind-ui';

import type { ResultSelection } from './result-selection.context';
import {
	isClassifiable,
	type SelectableResult
} from './result-selection.utils';

export interface SelectListedResultsProps {
	selection: Pick<ResultSelection, 'isSelected' | 'select' | 'deselect'>;
	/** The rows the page lists; their classifiable ones are what it picks. */
	listed: readonly SelectableResult[];
}

/**
 * Select All in the selection popover: picks every classifiable row the page
 * lists, and is filled while they all are; pressed again, it drops them.
 * Plain passes are left alone, as Classify could not take them, and picks
 * made elsewhere stay.
 */
export function SelectListedResults({
	selection,
	listed
}: SelectListedResultsProps) {
	const pickable = listed.filter(isClassifiable);
	const allSelected =
		pickable.length > 0 &&
		pickable.every((row) => selection.isSelected(row.result_id));

	return (
		<Tooltip
			content={
				!pickable.length
					? 'None of the listed results can be classified: only failed or classified results can.'
					: allSelected
					? 'Drop the listed results from the selection'
					: 'Select every listed failed or classified result'
			}
		>
			<ButtonTw
				variant={allSelected ? 'primary' : 'secondary'}
				size="xss"
				rounded="md"
				aria-pressed={allSelected}
				disabled={!pickable.length}
				onClick={() =>
					allSelected
						? selection.deselect(pickable.map((row) => row.result_id))
						: selection.select(pickable)
				}
				data-testid="results-selection-select-all"
			>
				<Icon
					name="BoxCheckmark"
					size={16}
					viewBox="1.94 1 14 14"
					className="mr-1"
				/>
				Select All
			</ButtonTw>
		</Tooltip>
	);
}
