/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { parseDate } from '@internationalized/date';
import { sub } from 'date-fns';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { parseISODuration } from '@/shared/utils';
import { BUBLIK_TAG, bublikAPI } from '@/services/bublik-api';
import { BoxValue } from '@/shared/tailwind-ui';
import { useMount } from '@/shared/hooks';

import { RunsForm, RunsFormValues } from './runs-form.component';
import {
	createRunsSearchFiltersSnapshot,
	getSelectedRunData
} from './runs-form.utils';
import { updateGlobalFilter } from '../runs-slice';
import { selectAllTags } from '../runs-slice.selectors';
import { normalizeRunDataList, normalizeRunDataValue } from '../runs-key-value';
import { runsRoute, type RunsSearchValues } from '../runs-search';
import { useRunsFormWriter } from '../hooks';

function RunsFormContainer() {
	const dispatch = useDispatch();
	const search = runsRoute.useSearch();
	const writeRunsForm = useRunsFormWriter();
	const allTags = useSelector(selectAllTags);

	useMount(() => {
		const initialGlobalFilter = normalizeRunDataList(
			search.runData?.filter(Boolean) ?? []
		);

		dispatch(updateGlobalFilter(initialGlobalFilter));
	});

	const defaultValues = useMemo<RunsFormValues>(
		() => searchToForm(search, allTags),
		[allTags, search]
	);
	const appliedFilters = useMemo(
		() => createRunsSearchFiltersSnapshot(search),
		[search]
	);

	function handleFormSubmit(newForm: RunsFormValues) {
		const selectedRunData = normalizeRunDataList(
			getSelectedRunData(newForm.runData)
		);

		trackEvent(analyticsEventNames.runsFormSubmit, {
			calendarMode: newForm.calendarMode,
			hasDateRange: Boolean(newForm.dates?.start && newForm.dates?.end),
			hasTagExpr: Boolean(newForm.tagExpr.trim()),
			selectedRunDataCount: selectedRunData.length
		});

		writeRunsForm(newForm);
		dispatch(updateGlobalFilter(selectedRunData));
		dispatch(bublikAPI.util.invalidateTags([BUBLIK_TAG.SessionList]));
	}

	function handleResetFormClick(resettedForm: RunsFormValues) {
		trackEvent(analyticsEventNames.runsFormReset, {
			calendarMode: resettedForm.calendarMode,
			hadDateRange: Boolean(search.startDate) || Boolean(search.finishDate),
			hadTagExpr: Boolean(search.tagExpr),
			hadSelectedRunData: Boolean(search.runData?.length)
		});

		dispatch(updateGlobalFilter([]));
		dispatch(bublikAPI.util.invalidateTags([BUBLIK_TAG.SessionList]));

		writeRunsForm(resettedForm, { dropDuration: true });
	}

	return (
		<RunsForm
			defaultValues={defaultValues}
			appliedFilters={appliedFilters}
			onRunsFormSubmit={handleFormSubmit}
			onResetFormClick={handleResetFormClick}
		/>
	);
}

function searchToForm(
	search: RunsSearchValues,
	allTags: BoxValue[]
): RunsFormValues {
	const normalizedAllTags = allTags.map((tag) => {
		const normalizedValue = normalizeRunDataValue(tag.value);

		return {
			...tag,
			value: normalizedValue,
			label: normalizedValue
		};
	});

	const rawStart = search.startDate;
	const rawEnd = search.finishDate;
	const calendarMode = (search.calendarMode ??
		'default') as RunsFormValues['calendarMode'];
	const tagExpr = search.tagExpr ?? '';
	const searchDuration = search.duration;

	const defaultValues: RunsFormValues = {
		calendarMode,
		runData: normalizedAllTags,
		tagExpr,
		dates: null
	};

	try {
		if (!rawStart || !rawEnd) return defaultValues;

		defaultValues.dates = {
			start: parseDate(rawStart),
			end: parseDate(rawEnd)
		};

		if (calendarMode === 'duration' && searchDuration) {
			const duration = parseISODuration(searchDuration);

			const endDate = new Date();
			const startDate = sub(endDate, duration);

			defaultValues.dates = {
				start: parseDate(startDate.toISOString()),
				end: parseDate(endDate.toISOString())
			};
		}
	} catch (e: unknown) {
		return defaultValues;
	}

	return defaultValues;
}

export { RunsFormContainer };
