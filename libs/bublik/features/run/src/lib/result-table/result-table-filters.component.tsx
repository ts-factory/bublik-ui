/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	isClassifiable,
	useResultSelection
} from '@/bublik/features/result-classification';
import {
	ButtonTw,
	DataTableFacetedFilter,
	Icon,
	Separator,
	TOOLBAR_BUTTON_CLASS,
	TOOLBAR_ICON_CLASS,
	TOOLBAR_LABEL_CLASS,
	Tooltip,
	cn
} from '@/shared/tailwind-ui';
import type { RunDataResults } from '@/shared/types';

import { COLUMN_ID } from './constants';
import type { useDataTableFilters } from './result-table.component';

export interface ResultTableFiltersProps {
	filters: ReturnType<typeof useDataTableFilters>;
	/**
	 * The rows on screen, whose classifiable ones Select All picks for
	 * classifying in bulk. Left out, or with no selection to pick into, the
	 * button is not drawn.
	 */
	selectable?: readonly RunDataResults[];
	className?: string;
}

/**
 * The filter row every host of the result table shows above it:
 * `facets | Reset … Select All`. The facets scroll sideways on a narrow
 * window rather than wrap, so the row keeps one height for the header pinned
 * under it; Reset stays beside them, outside the scroll, so it is never
 * scrolled out of reach. State comes from `useDataTableFilters`.
 */
export function ResultTableFilters({
	filters,
	selectable,
	className
}: ResultTableFiltersProps) {
	const {
		requirements,
		parameters,
		verdicts,
		results,
		resultProperties,
		categories,
		classifications,
		artifacts,
		requirementsFilter,
		parametersFilter,
		verdictsFilter,
		resultsFilter,
		resultPropertiesFilter,
		categoriesFilter,
		classificationsFilter,
		artifactsFilter,
		onClearFilters,
		onFilterChange,
		onRequirementsFilterChange,
		onVerdictsFilterChange,
		onResultsFilterChange,
		onResultPropertiesFilterChange,
		onCategoriesFilterChange,
		onClassificationsFilterChange
	} = filters;

	return (
		<div className={cn('flex items-center gap-2', className)}>
			<div className="styled-scrollbar flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap [&>*]:shrink-0">
				<DataTableFacetedFilter
					title="Obtained Result"
					size="xss"
					options={results}
					value={resultsFilter}
					onChange={onResultsFilterChange}
					disabled={!results.length}
				/>
				<DataTableFacetedFilter
					title="Result Type"
					size="xss"
					options={resultProperties}
					value={resultPropertiesFilter}
					onChange={onResultPropertiesFilterChange}
					disabled={!resultProperties.length}
				/>
				<DataTableFacetedFilter
					title="Verdicts"
					size="xss"
					options={verdicts}
					value={verdictsFilter}
					onChange={onVerdictsFilterChange}
					disabled={!verdicts.length}
				/>
				{/* Beside Verdicts, because it answers the same question one step
				    further on: the verdict says what went wrong, the category says
				    what it was decided to be. */}
				<DataTableFacetedFilter
					title="Category"
					size="xss"
					options={categories}
					value={categoriesFilter}
					onChange={onCategoriesFilterChange}
					disabled={!categories.length}
				/>
				{/* After Category, completing the thought: the category says what a
				    failure was decided to be, this says what that decision did to
				    the run's unexpected count. */}
				<DataTableFacetedFilter
					title="Classification"
					size="xss"
					options={classifications}
					value={classificationsFilter}
					onChange={onClassificationsFilterChange}
					disabled={!classifications.length}
				/>
				<DataTableFacetedFilter
					title="Artifacts"
					size="xss"
					options={artifacts}
					value={artifactsFilter}
					onChange={(values) => onFilterChange(COLUMN_ID.ARTIFACTS, values)}
					disabled={!artifacts.length}
				/>
				<DataTableFacetedFilter
					title="Parameters"
					size="xss"
					options={parameters}
					value={parametersFilter}
					onChange={(values) => onFilterChange(COLUMN_ID.PARAMETERS, values)}
					disabled={!parameters.length}
				/>
				<DataTableFacetedFilter
					title="Requirements"
					size="xss"
					options={requirements}
					value={requirementsFilter}
					onChange={onRequirementsFilterChange}
					disabled={!requirements.length}
				/>
			</div>
			<Separator orientation="vertical" className="h-5 shrink-0" />
			<Tooltip content="Reset">
				<ButtonTw
					variant="secondary"
					size="xss"
					aria-label="Reset"
					className={cn(TOOLBAR_BUTTON_CLASS, 'shrink-0')}
					onClick={onClearFilters}
				>
					<Icon name="Bin" size={18} className={TOOLBAR_ICON_CLASS} />
					<span className={TOOLBAR_LABEL_CLASS}>Reset</span>
				</ButtonTw>
			</Tooltip>
			{selectable ? (
				<div className="ml-auto flex shrink-0 items-center gap-2">
					<SelectAllButton rows={selectable} />
				</div>
			) : null}
		</div>
	);
}

interface SelectAllButtonProps {
	rows: readonly RunDataResults[];
}

/**
 * Picks every classifiable row on screen into the selection, filled while
 * they all are; pressed again, it drops them. The plain passes are left
 * alone, as Classify could not take them. Rows picked elsewhere stay
 * picked, as the selection spans tables.
 */
function SelectAllButton({ rows }: SelectAllButtonProps) {
	const selection = useResultSelection();

	if (!selection) return null;

	const pickable = rows.filter(isClassifiable);
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
					: 'Select every listed failed or classified result to classify them at once'
			}
		>
			<ButtonTw
				variant={allSelected ? 'primary' : 'secondary'}
				size="xss"
				aria-pressed={allSelected}
				aria-label="Select All"
				className={TOOLBAR_BUTTON_CLASS}
				disabled={!pickable.length}
				onClick={() =>
					allSelected
						? selection.deselect(pickable.map((row) => row.result_id))
						: selection.select(pickable)
				}
				data-testid="result-table-select-all"
			>
				{/* The icon draws a smaller box on a 17×16 grid; framing it tighter
				    matches the box and stroke of the History link's icon beside it. */}
				<Icon
					name="BoxCheckmark"
					size={20}
					viewBox="1.94 1 14 14"
					className={TOOLBAR_ICON_CLASS}
				/>
				<span className={TOOLBAR_LABEL_CLASS}>Select All</span>
			</ButtonTw>
		</Tooltip>
	);
}
