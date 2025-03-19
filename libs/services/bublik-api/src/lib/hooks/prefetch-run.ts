/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect } from 'react';

import { usePrefetch } from '../bublikAPI';

export interface UsePrefetchRunConfig {
	runId?: string;
}

/** Prefetches run page header | run table | source */
export const usePrefetchRun = ({ runId }: UsePrefetchRunConfig) => {
	const prefetchRunHeader = usePrefetch('getRunDetails');
	const prefetchRunTable = usePrefetch('getRunTableByRunId');
	const prefetchRunSource = usePrefetch('getRunSource');
	const prefetchCompromisedTags = usePrefetch('getCompromisedTags');

	useEffect(() => {
		if (!runId) return;

		prefetchRunHeader(runId);
		prefetchRunTable({ runId });
		prefetchRunSource(runId);
		prefetchCompromisedTags();
	}, [
		runId,
		prefetchRunHeader,
		prefetchRunSource,
		prefetchRunTable,
		prefetchCompromisedTags
	]);
};
