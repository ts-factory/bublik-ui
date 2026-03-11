/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { getLocalTimeZone } from '@internationalized/date';
import { formatISODuration, intervalToDuration } from 'date-fns';

import { formatTimeToAPI } from '@/shared/utils';

import type { RunsFormValues } from './runs-form.component';

export interface RunsFormFiltersSnapshot {
	calendarMode: RunsFormValues['calendarMode'];
	startDate: string;
	finishDate: string;
	duration: string;
	tagExpr: string;
	runData: string[];
}

const normalizeRunData = (runData: string[]): string[] =>
	Array.from(new Set(runData.filter(Boolean))).sort((left, right) =>
		left.localeCompare(right)
	);

const normalizeFilterValue = (value: string | null | undefined): string =>
	value ?? '';

export const getSelectedRunData = (
	runData: RunsFormValues['runData']
): string[] =>
	normalizeRunData(
		runData.filter((value) => value.isSelected).map((value) => value.value)
	);

export function createRunsFormFiltersSnapshot(
	form: RunsFormValues
): RunsFormFiltersSnapshot {
	const startDate = form.dates?.start
		? formatTimeToAPI(form.dates.start.toDate(getLocalTimeZone()))
		: '';
	const finishDate = form.dates?.end
		? formatTimeToAPI(form.dates.end.toDate(getLocalTimeZone()))
		: '';
	const duration =
		form.calendarMode === 'duration' && form.dates?.start && form.dates?.end
			? formatISODuration(
					intervalToDuration({
						start: form.dates.start.toDate(getLocalTimeZone()),
						end: form.dates.end.toDate(getLocalTimeZone())
					})
			  )
			: '';

	return {
		calendarMode: form.calendarMode,
		startDate,
		finishDate,
		duration,
		tagExpr: form.tagExpr,
		runData: getSelectedRunData(form.runData)
	};
}

export function createRunsSearchParamsFiltersSnapshot(
	searchParams: URLSearchParams
): RunsFormFiltersSnapshot {
	return {
		calendarMode: (searchParams.get('calendarMode') ??
			'default') as RunsFormValues['calendarMode'],
		startDate: normalizeFilterValue(searchParams.get('startDate')),
		finishDate: normalizeFilterValue(searchParams.get('finishDate')),
		duration: normalizeFilterValue(searchParams.get('duration')),
		tagExpr: normalizeFilterValue(searchParams.get('tagExpr')),
		runData: normalizeRunData(
			normalizeFilterValue(searchParams.get('runData'))
				.split(';')
				.filter(Boolean)
		)
	};
}

export function areRunsFiltersSnapshotsEqual(
	left: RunsFormFiltersSnapshot,
	right: RunsFormFiltersSnapshot
): boolean {
	if (left.calendarMode !== right.calendarMode) return false;
	if (left.tagExpr !== right.tagExpr) return false;
	if (left.runData.length !== right.runData.length) return false;

	const hasDifferentRunData = left.runData.some(
		(value, index) => value !== right.runData[index]
	);

	if (hasDifferentRunData) return false;

	if (left.calendarMode === 'duration') {
		return left.duration === right.duration;
	}

	return (
		left.startDate === right.startDate && left.finishDate === right.finishDate
	);
}
