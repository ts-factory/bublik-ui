/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { lazy, Suspense } from 'react';

import { Spinner } from '@/shared/tailwind-ui';

import { RunsTableContainer } from '../runs-table';
import { runsRoute } from '../runs-search';

const RunsStatsContainer = lazy(() =>
	import('../runs-stats').then((module) => ({
		default: module.RunsStatsContainer
	}))
);

const RunsProgressContainer = lazy(() =>
	import('../runs-progress').then((module) => ({
		default: module.RunsProgressContainer
	}))
);

export const RunsModePickerContainer = () => {
	const mode = runsRoute.useSearch({
		select: (search): string | undefined => search.mode
	});

	if (mode === 'table') return <RunsTableContainer />;

	if (mode === 'charts') {
		return (
			<Suspense fallback={<Spinner className="h-48" />}>
				<RunsStatsContainer />
			</Suspense>
		);
	}

	if (mode === 'progress') {
		return (
			<Suspense fallback={<Spinner className="h-48" />}>
				<RunsProgressContainer />
			</Suspense>
		);
	}

	return <RunsTableContainer />;
};
