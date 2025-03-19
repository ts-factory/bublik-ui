/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { MergedRun, RunData } from '@/shared/types';

export const getStats =
	(keys: Array<keyof RunData['stats']>) =>
	(data?: RunData | MergedRun | null): number | null => {
		if (!data) return null;

		return keys.reduce((acc, key) => data.stats[key] + acc, 0);
	};

export const getTreeNode = (data?: RunData | MergedRun | null) => {
	if (!data) return null;

	const name = data.name;
	const type = data.type;

	return { name, type };
};

export const getTotalRunStats = (data?: RunData | MergedRun | null) => {
	return getStats([
		'abnormal',
		'failed',
		'failed_unexpected',
		'passed',
		'passed_unexpected',
		'skipped',
		'skipped_unexpected'
	])(data);
};

export const getRunRunStats = (data?: RunData | MergedRun | null) => {
	return getStats([
		'failed',
		'failed_unexpected',
		'passed',
		'passed_unexpected'
	])(data);
};

export const getPassedExpected = (data?: RunData | MergedRun | null) => {
	return getStats(['passed'])(data);
};

export const getFailedExpected = (data?: RunData | MergedRun | null) => {
	return getStats(['failed'])(data);
};

export const getPassedUnexpected = (data?: RunData | MergedRun | null) => {
	return getStats(['passed_unexpected'])(data);
};

export const getFailedUnexpected = (data?: RunData | MergedRun | null) => {
	return getStats(['failed_unexpected'])(data);
};

export const getSkippedExpected = (data?: RunData | MergedRun | null) => {
	return getStats(['skipped'])(data);
};

export const getSkippedUnexpected = (data?: RunData | MergedRun | null) => {
	return getStats(['skipped_unexpected'])(data);
};

export const getAbnormal = (data?: RunData | MergedRun | null) => {
	return getStats(['abnormal'])(data);
};

/** Return all aggregated stats for purpose of comparing */
export const getCalculatedStats = (
	data?: RunData | MergedRun | null
): Readonly<Record<string, number | null>> => {
	return {
		total: getTotalRunStats(data),
		run: getRunRunStats(data),
		passedExpected: getPassedExpected(data),
		failedExpected: getFailedExpected(data),
		passedUnexpected: getPassedUnexpected(data),
		failedUnexpected: getFailedUnexpected(data),
		skippedExpected: getSkippedExpected(data),
		skippedUnexpected: getSkippedUnexpected(data),
		abnormal: getAbnormal(data)
	} as const;
};
