/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect } from 'react';

import { usePrefetch } from '../bublikAPI';

export interface UsePrefetchLogPageConfig {
	runId?: string;
	resultId?: string;
}

/** Prefetches log page header and log page tree */
export const usePrefetchLogPage = ({
	runId,
	resultId
}: UsePrefetchLogPageConfig) => {
	const prefetchDetails = usePrefetch('getRunDetails');
	const prefetchTree = usePrefetch('getTreeByRunId');
	const prefetchMeasurementsLink = usePrefetch('getResultInfo');

	useEffect(() => {
		if (!runId) return;

		prefetchDetails(runId);
		prefetchTree(runId);
		if (resultId) prefetchMeasurementsLink(resultId);
	}, [
		runId,
		resultId,
		prefetchTree,
		prefetchDetails,
		prefetchMeasurementsLink
	]);
};
