/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { getDefaultHistoryDateRange } from '@/bublik/config';
import { BadgeVariants, badgeVariantStyles, cn } from '@/shared/tailwind-ui';
import {
	VERDICT_TYPE,
	RESULT_TYPE,
	RUN_PROPERTIES,
	RESULT_PROPERTIES
} from '@/shared/types';

interface HistoryConfig {
	verdict: VERDICT_TYPE;
	results: RESULT_TYPE[];
	runProperties: RUN_PROPERTIES[];
	resultProperties: RESULT_PROPERTIES[];
	startDate: Date;
	endDate: Date;
}

const createHistoryConfig = (): HistoryConfig => {
	const defaultVerdict = VERDICT_TYPE.String;

	const defaultResults = [
		RESULT_TYPE.Passed,
		RESULT_TYPE.Failed,
		RESULT_TYPE.Killed,
		RESULT_TYPE.Cored,
		RESULT_TYPE.Skipped,
		RESULT_TYPE.Faked,
		RESULT_TYPE.Incomplete,
		RESULT_TYPE.Empty,
		RESULT_TYPE.Unspec
	];
	const defaultRunProperties = [RUN_PROPERTIES.NotCompromised];

	const defaultResultProperties = [
		RESULT_PROPERTIES.Expected,
		RESULT_PROPERTIES.Unexpected
	];

	const defaultDates = getDefaultHistoryDateRange();

	return {
		verdict: defaultVerdict,
		results: defaultResults,
		runProperties: defaultRunProperties,
		resultProperties: defaultResultProperties,
		startDate: defaultDates.startDate,
		endDate: defaultDates.finishDate
	};
};

export const HISTORY_CONSTANTS = createHistoryConfig();

/**
 * The colours of the form's badges and of their suggestions' chips: each kind
 * of value looks as it does where the rest of the UI shows it most.
 */
export const HISTORY_FIELD_BADGE_CLASS = {
	/** History's own Parameters column (`history-linear.columns.tsx`) */
	parameters: 'bg-badge-1',
	/** Run details' Important tags, and the runs page's (`list-item.tsx`) */
	importantTags: 'bg-badge-6',
	/** Run details' other tags, and the runs page's (`run-details/utils.ts`) */
	tags: 'bg-badge-0',
	/** Run details' Labels (`run-details.component.tsx`) */
	labels: 'bg-badge-10',
	/** Run details' Branches (`run-details.component.tsx`) */
	branches: 'bg-badge-16',
	/** Run details' Revisions (`run-details.component.tsx`) */
	revisions: 'bg-badge-2',
	/** History's verdict badges, the Transparent variant (`verdict-list.tsx`) */
	verdicts: cn(
		'border',
		badgeVariantStyles({ variant: BadgeVariants.Transparent })
	)
} as const;
