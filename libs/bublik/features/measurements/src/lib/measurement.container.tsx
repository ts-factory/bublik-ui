/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useParams } from 'react-router-dom';
import { skipToken } from '@reduxjs/toolkit/query';

import { MeasurementsRouterParams, MeasurementsSearch } from '@/shared/types';
import { useSearchState } from '@/router';
import {
	useGetResultInfoQuery,
	usePrefetchLogPage,
	usePrefetchRun
} from '@/services/bublik-api';
import { ScrollToTopPage } from '@/shared/tailwind-ui';

import { ModePicker } from './components';
import { useMeasurementTitle } from './measurement.hooks';

export const MeasurementContainer = () => {
	const [search] = useSearchState<MeasurementsSearch>();
	const { runId, resultId } = useParams<MeasurementsRouterParams>();
	const { data } = useGetResultInfoQuery(resultId ?? skipToken);

	useMeasurementTitle({
		name: data?.result.name,
		start: data?.result.start,
		runId
	});
	usePrefetchRun({ runId });
	usePrefetchLogPage({ runId, resultId });

	return (
		<>
			<ModePicker mode={search?.mode} />
			<ScrollToTopPage />
		</>
	);
};
