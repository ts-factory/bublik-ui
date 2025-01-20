/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useSearchParams } from 'react-router-dom';
import { getLocalTimeZone, parseDate } from '@internationalized/date';

import { formatTimeToAPI, formatTimeToDot } from '@/shared/utils';
import { useMount } from '@/shared/hooks';

import { RunsForm, RunsFormValues } from './runs-form.component';
import { updateGlobalFilter } from '../runs-slice';
import { selectAllTags, selectGlobalFilter } from '../runs-slice.selectors';
import { BUBLIK_TAG, bublikAPI } from '@/services/bublik-api';

export const RunsFormContainer = () => {
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

	const defaultValues = useMemo<RunsFormValues>(() => {
		const rawStart = searchParams.get('startDate');
		const rawEnd = searchParams.get('finishDate');

		const defaultVal = {
			runData: allTags,
			tagExpr: searchParams.get('tagExpr') || '',
			dates: null
		};

		try {
			if (rawStart && rawEnd) {
				return {
					runData: allTags,
					tagExpr: searchParams.get('tagExpr') || '',
					dates: { start: parseDate(rawStart), end: parseDate(rawEnd) }
				};
			}
		} catch (e: unknown) {
			return defaultVal;
		}

		return defaultVal;
	}, [allTags, searchParams]);

	const getNewSearchParams = useCallback(
		(form: RunsFormValues) => {
			const { runData, tagExpr, dates } = form;
			const params = new URLSearchParams(searchParams);

			// 1. Dates
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

			// 2. Run data
			const selectedRunData = runData
				.filter((v) => v.isSelected)
				.map((v) => v.value);

			selectedRunData.length
				? params.set('runData', selectedRunData.join(';'))
				: params.delete('runData');

			// 3. Run expressions
			tagExpr ? params.set('tagExpr', tagExpr) : params.delete('tagExpr');

			params.set('page', '1');
			return params;
		},
		[searchParams]
	);

	const handleFormSubmit = useCallback(
		(newForm: RunsFormValues) => {
			setSearchParams(getNewSearchParams(newForm), { replace: true });
			dispatch(
				updateGlobalFilter(
					newForm.runData.filter((v) => v.isSelected).map((v) => v.value)
				)
			);
			dispatch(bublikAPI.util.invalidateTags([BUBLIK_TAG.SessionList]));
		},
		[dispatch, getNewSearchParams, setSearchParams]
	);

	const handleResetFormClick = useCallback(
		(resettedForm: RunsFormValues) => {
			dispatch(updateGlobalFilter([]));
			dispatch(bublikAPI.util.invalidateTags([BUBLIK_TAG.SessionList]));
			setSearchParams(getNewSearchParams(resettedForm), { replace: true });
		},
		[dispatch, getNewSearchParams, setSearchParams]
	);

	useEffect(() => {
		if (!searchParams.get('startDate') && !searchParams.get('finishDate')) {
			document.title = `Runs - Bublik`;
			return;
		}

		const start = formatTimeToDot(searchParams.get('startDate') || '');
		const end = formatTimeToDot(searchParams.get('finishDate') || '');

		document.title = `${start} - ${end} | Runs - Bublik `;
	}, [searchParams]);

	return (
		<RunsForm
			key={`${localGlobalFilter.length}_${defaultValues.runData.length}`}
			defaultValues={defaultValues}
			onRunsFormSubmit={handleFormSubmit}
			onResetFormClick={handleResetFormClick}
		/>
	);
};
