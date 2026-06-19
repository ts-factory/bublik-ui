/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { createSelector } from '@reduxjs/toolkit';

import type { BoxValue } from '@/shared/tailwind-ui';

import {
	type AppStateWithRunsSlice,
	RUNS_PAGE_SLICE,
	runsAdapter
} from './runs-slice';

const getRunsPageState = (state: AppStateWithRunsSlice) =>
	state[RUNS_PAGE_SLICE];

export const selectGlobalFilter = createSelector(
	getRunsPageState,
	(state) => state.globalFilter
);

export const selectRowSelection = createSelector(getRunsPageState, (state) =>
	Object.fromEntries(state.rowSelection.map((id) => [id, true]))
);

export const selectCompareIds = createSelector(
	getRunsPageState,
	(state) => state.rowSelection
);

export const getResults = createSelector(
	getRunsPageState,
	(state) => state.results
);

const { selectAll: selectAllRuns } = runsAdapter.getSelectors(getResults);

export const RUN_DATA_GROUP_ORDER = ['Important', 'Metadata', 'Tags'] as const;

export const selectAllTags = createSelector(
	selectAllRuns,
	selectGlobalFilter,
	(runs, globalFilter) => {
		const DEFAULT_BG = 'bg-badge-0';
		const IMPORTANT_BG = 'bg-badge-6';
		const META_BG = 'bg-badge-4';
		const [IMPORTANT_GROUP, META_GROUP, TAGS_GROUP] = RUN_DATA_GROUP_ORDER;

		const important = runs.flatMap((run) => run.important_tags);
		const metas = runs.flatMap((run) => run.metadata);
		const tags = runs.flatMap((run) => run.relevant_tags);

		const importantSet = new Set(important);
		const metaSet = new Set(metas);
		const tagsSet = new Set(tags);

		const getGroupLabel = (value: string) => {
			if (importantSet.has(value)) return IMPORTANT_GROUP;
			if (metaSet.has(value)) return META_GROUP;
			if (tagsSet.has(value)) return TAGS_GROUP;
			return META_GROUP;
		};

		const getClassName = (value: string) => {
			if (importantSet.has(value)) return IMPORTANT_BG;
			if (metaSet.has(value)) return META_BG;
			return DEFAULT_BG;
		};

		const boxesMap = new Map<string, BoxValue>();

		const upsertBox = (value: string, isSelected = false) => {
			const current = boxesMap.get(value);

			boxesMap.set(value, {
				label: value,
				value,
				isSelected: current?.isSelected || isSelected,
				className: getClassName(value),
				groupLabel: getGroupLabel(value)
			});
		};

		globalFilter.forEach((value) => upsertBox(value, true));
		Array.from(importantSet).forEach((value) => upsertBox(value));
		Array.from(metaSet).forEach((value) => upsertBox(value));
		Array.from(tagsSet).forEach((value) => upsertBox(value));

		return Array.from(boxesMap.values());
	}
);
