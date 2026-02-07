/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Spinner } from '@/shared/tailwind-ui';

import { RunsTableContainer } from '../runs-table';

const RunsStatsContainer = lazy(() =>
	import('../runs-stats').then((module) => ({
		default: module.RunsStatsContainer
	}))
);

export const RunsModePickerContainer = () => {
	const [searchParams] = useSearchParams();

	if (searchParams.get('mode') === 'table') return <RunsTableContainer />;

	if (searchParams.get('mode') === 'charts') {
		return (
			<Suspense fallback={<Spinner className="h-48" />}>
				<RunsStatsContainer />
			</Suspense>
		);
	}

	return <RunsTableContainer />;
};
