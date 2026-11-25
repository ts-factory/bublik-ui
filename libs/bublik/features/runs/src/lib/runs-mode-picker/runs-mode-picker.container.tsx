/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Spinner } from '@/shared/tailwind-ui';

import { RunsTableContainer } from '../runs-table';
// PROTOTYPE: run comment variants, see ../runs-comments-prototype.
import { RunsCommentsPrototypeSwitcher } from '../runs-comments-prototype';

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
	const [searchParams] = useSearchParams();

	const table = (
		<>
			<RunsTableContainer />
			<RunsCommentsPrototypeSwitcher />
		</>
	);

	if (searchParams.get('mode') === 'table') return table;

	if (searchParams.get('mode') === 'charts') {
		return (
			<Suspense fallback={<Spinner className="h-48" />}>
				<RunsStatsContainer />
			</Suspense>
		);
	}

	if (searchParams.get('mode') === 'progress') {
		return (
			<Suspense fallback={<Spinner className="h-48" />}>
				<RunsProgressContainer />
			</Suspense>
		);
	}

	return table;
};
