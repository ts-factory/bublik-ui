/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback } from 'react';
import { Row } from '@tanstack/react-table';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { MergedRun, RunData } from '@/shared/types';

import {
	ResultViewMode,
	useResultView
} from '../result-matrix/result-view.hooks';
import { ResultViewToggle } from './result-view-toggle';
import { useRunResults } from './use-run-results';

export interface ResultViewSwitchProps {
	/** The expanded run-table test row whose iterations are shown. */
	row: Row<RunData | MergedRun>;
}

/**
 * List / Matrix switch of an expanded test row. Lives in the run table's
 * tree cell; the expanded content below reads the same URL state.
 */
export function ResultViewSwitch(props: ResultViewSwitchProps) {
	const { row } = props;
	const { view: requestedView, patch } = useResultView(row.id);
	const { canShowMatrix } = useRunResults(row);
	const view: ResultViewMode =
		requestedView === 'matrix' && canShowMatrix ? 'matrix' : 'list';

	const handleChange = useCallback(
		(next: ResultViewMode) => {
			trackEvent(analyticsEventNames.resultViewToggle, { view: next });
			// 'list' is the default, so it is stored as "no value".
			patch({ view: next === 'list' ? undefined : next });
		},
		[patch]
	);

	return (
		<ResultViewToggle
			value={view}
			onChange={handleChange}
			matrixDisabled={!canShowMatrix}
		/>
	);
}
