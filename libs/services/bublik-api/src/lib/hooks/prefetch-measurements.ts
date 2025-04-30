/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import { usePrefetch, bublikAPI } from '../bublikAPI';

export interface UsePrefetchMeasurementsPageConfig {
	resultId?: string;
}

/** Prefetches measurements page */
export const usePrefetchMeasurementsPage = ({
	resultId
}: UsePrefetchMeasurementsPageConfig) => {
	const prefetchMeasurementsHeader = usePrefetch('getResultInfo');
	const prefetchChartsAndTable = usePrefetch('getSingleMeasurement');

	const { isLoading: isResultInfoLoading } =
		bublikAPI.endpoints.getResultInfo.useQueryState(resultId ?? skipToken);
	const { isLoading: isChartsLoading } =
		bublikAPI.endpoints.getSingleMeasurement.useQueryState(
			resultId ?? skipToken
		);

	useEffect(() => {
		if (!resultId) return;

		prefetchMeasurementsHeader(resultId);
		prefetchChartsAndTable(resultId);
	}, [prefetchChartsAndTable, prefetchMeasurementsHeader, resultId]);

	return { isLoading: isResultInfoLoading || isChartsLoading } as const;
};
