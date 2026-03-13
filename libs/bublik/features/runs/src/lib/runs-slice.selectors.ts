/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	createEntityAdapter,
	createSelector,
	EntityId
} from '@reduxjs/toolkit';

import type { RunsData } from '@/shared/types';
import type { BoxValue } from '@/shared/tailwind-ui';

import { type AppStateWithRunsSlice, RUNS_PAGE_SLICE } from './runs-slice';

export const runsAdapter = createEntityAdapter<RunsData, EntityId>({
	selectId: (run) => run.id.toString()
});

const getRunsPageState = (state: AppStateWithRunsSlice) =>
	state[RUNS_PAGE_SLICE];

export const selectGlobalFilter = createSelector(
	getRunsPageState,
	(state) => state.globalFilter
);

export const getResults = createSelector(
	getRunsPageState,
	(state) => state.results
);

const { selectAll: selectAllRuns } = runsAdapter.getSelectors(getResults);

export const selectAllTags = createSelector(
	selectAllRuns,
	selectGlobalFilter,
	(runs, globalFilter) => {
		const DEFAULT_BG = 'bg-badge-0';
		const IMPORTANT_BG = 'bg-badge-6';
		const META_BG = 'bg-badge-4';

		const important = runs.flatMap((run) => run.important_tags);
		const metas = runs.flatMap((run) => run.metadata);
		const tags = runs.flatMap((run) => run.relevant_tags);

		const importantSet = new Set(important);
		const metaSet = new Set(metas);
		const tagsSet = new Set(tags);

		const currentTicked: BoxValue[] = globalFilter.map((filterValue) => {
			let bgClassName = DEFAULT_BG;

			if (importantSet.has(filterValue)) bgClassName = IMPORTANT_BG;
			if (metaSet.has(filterValue)) bgClassName = META_BG;

			return {
				label: filterValue,
				value: filterValue,
				isSelected: true,
				className: bgClassName
			};
		});

		const importantBoxes: BoxValue[] = Array.from(importantSet).map((v) => ({
			label: v,
			value: v,
			className: IMPORTANT_BG
		}));

		const metaBoxes: BoxValue[] = Array.from(metaSet).map((v) => ({
			label: v,
			value: v,
			className: META_BG
		}));

		const tagsBoxes: BoxValue[] = Array.from(tagsSet).map((v) => ({
			label: v,
			value: v,
			className: DEFAULT_BG
		}));

		return [...currentTicked, ...importantBoxes, ...metaBoxes, ...tagsBoxes];
	}
);
