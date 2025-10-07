/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useSearchParams } from 'react-router-dom';
import { getLocalTimeZone, parseDate } from '@internationalized/date';
import { formatISODuration, intervalToDuration, sub } from 'date-fns';

import { formatTimeToAPI, parseISODuration } from '@/shared/utils';
import { BUBLIK_TAG, bublikAPI } from '@/services/bublik-api';
import { BoxValue } from '@/shared/tailwind-ui';
import { useMount } from '@/shared/hooks';

import { RunsForm, RunsFormValues } from './runs-form.component';
import { updateGlobalFilter } from '../runs-slice';
import { selectAllTags, selectGlobalFilter } from '../runs-slice.selectors';

function RunsFormContainer() {
	const dispatch = useDispatch();
	const location = useLocation();
	const [searchParams, setSearchParams] = useSearchParams(location.search);
	const localGlobalFilter = useSelector(selectGlobalFilter);
	const allTags = useSelector(selectAllTags);

	useMount(() => {
		const initialGlobalFilter =
			searchParams.get('runData')?.split(';')?.filter(Boolean) || [];

		dispatch(updateGlobalFilter(initialGlobalFilter));
	});

	const defaultValues = useMemo<RunsFormValues>(
		() => searchParamsToForm(searchParams, allTags),
		[allTags, searchParams]
	);

	function handleFormSubmit(newForm: RunsFormValues) {
		setSearchParams(formToSearchParams(searchParams, newForm), {
			replace: true
		});
		dispatch(
			updateGlobalFilter(
				newForm.runData.filter((v) => v.isSelected).map((v) => v.value)
			)
		);
		dispatch(bublikAPI.util.invalidateTags([BUBLIK_TAG.SessionList]));
	}

	function handleResetFormClick(resettedForm: RunsFormValues) {
		dispatch(updateGlobalFilter([]));
		dispatch(bublikAPI.util.invalidateTags([BUBLIK_TAG.SessionList]));

		const params = formToSearchParams(searchParams, resettedForm);
		params.delete('duration');

		setSearchParams(params, { replace: true });
	}

	return (
		<RunsForm
			key={`${localGlobalFilter.length}_${defaultValues.runData.length}`}
			defaultValues={defaultValues}
			onRunsFormSubmit={handleFormSubmit}
			onResetFormClick={handleResetFormClick}
		/>
	);
}

function searchParamsToForm(
	searchParams: URLSearchParams,
	allTags: BoxValue[]
): RunsFormValues {
	const rawStart = searchParams.get('startDate');
	const rawEnd = searchParams.get('finishDate');
	const calendarMode = (searchParams.get('calendarMode') ??
		'default') as RunsFormValues['calendarMode'];
	const tagExpr = searchParams.get('tagExpr') ?? '';
	const searchDuration = searchParams.get('duration');

	const defaultValues: RunsFormValues = {
		calendarMode,
		runData: allTags,
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

function formToSearchParams(
	initialSearchParams: URLSearchParams,
	form: RunsFormValues
): URLSearchParams {
	const { runData, tagExpr, dates, calendarMode } = form;
	const params = new URLSearchParams(initialSearchParams);

	params.set('calendarMode', calendarMode);

	const startDate = dates?.start
		? formatTimeToAPI(dates?.start.toDate(getLocalTimeZone()))
		: null;

	const finishDate = dates?.end
		? formatTimeToAPI(dates?.end.toDate(getLocalTimeZone()))
		: null;

	if (startDate && finishDate) {
		params.set('startDate', startDate);
		params.set('finishDate', finishDate);
	} else {
		params.delete('startDate');
		params.delete('finishDate');
	}

	if (calendarMode === 'duration' && dates?.start && dates?.end) {
		params.set(
			'duration',
			formatISODuration(
				intervalToDuration({
					start: dates.start.toDate(getLocalTimeZone()),
					end: dates.end.toDate(getLocalTimeZone())
				})
			)
		);
	}

	const selectedRunData = runData
		.filter((v) => v.isSelected)
		.map((v) => v.value);

	selectedRunData.length
		? params.set('runData', selectedRunData.join(';'))
		: params.delete('runData');

	tagExpr ? params.set('tagExpr', tagExpr) : params.delete('tagExpr');

	params.set('page', '1');
	return params;
}

export { RunsFormContainer };
