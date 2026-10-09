/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { getLocalTimeZone } from '@internationalized/date';
import { formatISODuration, intervalToDuration } from 'date-fns';

import { formatTimeToAPI } from '@/shared/utils';

import type { RunsSearchValues } from '../runs-search';
import { normalizeRunDataList } from '../runs-key-value';
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

/**
 * The search keys a run data filter writes: the sorted, deduplicated list
 * (no key when it is empty) and the first page.
 */
export function runDataSearch(runData: string[]): {
	runData: string[] | undefined;
	page: string;
} {
	const normalizedRunData = normalizeRunData(runData);

	return {
		runData: normalizedRunData.length ? normalizedRunData : undefined,
		page: '1'
	};
}

interface RunsSearchFromFormOptions {
	/** Reset drops `duration` outright: empty, it would describe a zero-length window. */
	dropDuration?: boolean;
}

/**
 * The whole `/runs` search a form submit or reset writes, from all the
 * current keys: `calendarMode` stamped, both dates set or both removed,
 * `duration` set in duration mode (never removed on submit), `tagExpr` and
 * `runData` set or removed, `page` back to 1. Keys keep their place and new
 * ones are appended in this order, as `URLSearchParams.set` did; `project`
 * moves to the end, where `useNavigateWithProject` used to put it back.
 * `undefined` removes a key.
 */
export function runsSearchFromForm(
	current: Record<string, unknown>,
	form: RunsFormValues,
	{ dropDuration = false }: RunsSearchFromFormOptions = {}
): Record<string, unknown> {
	const { runData, tagExpr, dates, calendarMode } = form;
	const next: Record<string, unknown> = { ...current, calendarMode };

	const startDate = dates?.start
		? formatTimeToAPI(dates.start.toDate(getLocalTimeZone()))
		: null;
	const finishDate = dates?.end
		? formatTimeToAPI(dates.end.toDate(getLocalTimeZone()))
		: null;

	if (startDate && finishDate) {
		next.startDate = startDate;
		next.finishDate = finishDate;
	} else {
		next.startDate = undefined;
		next.finishDate = undefined;
	}

	if (calendarMode === 'duration' && dates?.start && dates?.end) {
		next.duration = formatISODuration(
			intervalToDuration({
				start: dates.start.toDate(getLocalTimeZone()),
				end: dates.end.toDate(getLocalTimeZone())
			})
		);
	}

	next.tagExpr = tagExpr || undefined;
	Object.assign(
		next,
		runDataSearch(normalizeRunDataList(getSelectedRunData(runData)))
	);

	if (dropDuration) next.duration = undefined;

	const { project, ...rest } = next;

	return { ...rest, project };
}

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

export function createRunsSearchFiltersSnapshot(
	search: RunsSearchValues
): RunsFormFiltersSnapshot {
	return {
		calendarMode: (search.calendarMode ??
			'default') as RunsFormValues['calendarMode'],
		startDate: normalizeFilterValue(search.startDate),
		finishDate: normalizeFilterValue(search.finishDate),
		duration: normalizeFilterValue(search.duration),
		tagExpr: normalizeFilterValue(search.tagExpr),
		runData: normalizeRunData(search.runData ?? [])
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
