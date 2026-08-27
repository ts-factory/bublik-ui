/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	DashboardMode,
	HistoryMode,
	LogPageMode,
	MeasurementsMode
} from '@/shared/types';

export type RunConfig = {
	runId: number | string;
	targetIterationId?: number;
	resultFilter?: string;
};

export type DashboardConfig = {
	mode?: DashboardMode;
};

export type MeasurementsConfig = {
	runId: number | string;
	resultId: number | string;
	mode?: MeasurementsMode;
};

export type LogConfig = {
	runId: number | string;
	focusId?: number | string;
	mode?: LogPageMode;
};

export type HistoryConfig = {
	mode?: HistoryMode;
};

export type IssuesConfig = Record<string, never>;

export type IssueConfig = {
	issueId: number | string;
};

export type RunIssuesConfig = {
	runId: number | string;
};
