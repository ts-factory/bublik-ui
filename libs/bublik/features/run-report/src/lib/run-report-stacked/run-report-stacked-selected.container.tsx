/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2025 OKTET LTD */
import { RunReportStackedSelected } from './run-report-stacked-selected.component';
import { useRunReportStacked } from './run-report-stacked.hooks';

function RunReportStackedSelectedContainer() {
	const { selectedRecords, clearIds, removeId, toggleStacked } =
		useRunReportStacked();

	const items = selectedRecords.map((r) => ({
		id: r.id,
		label: r.measurement.label ?? ''
	}));

	return (
		<RunReportStackedSelected
			items={items}
			onResetClick={clearIds}
			onRemoveClick={removeId}
			onOpenClick={() => toggleStacked(true)}
		/>
	);
}

export { RunReportStackedSelectedContainer };
