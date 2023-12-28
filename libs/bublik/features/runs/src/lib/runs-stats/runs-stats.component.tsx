/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CardHeader, Icon, Skeleton } from '@/shared/tailwind-ui';

import { ConclusionSection, DaySection, TestsSection } from './components';
import { RunStats } from './runs-stats.types';
import { getErrorMessage } from '@/services/bublik-api';

export const RunsStatsLoading = () => {
	return (
		<main className="flex flex-col bg-white rounded-md">
			<CardHeader label="Runs Stats" />
			<Skeleton className="h-screen" />
		</main>
	);
};

export const RunsStatsEmpty = () => {
	return (
		<div className="grid place-items-center h-[calc(100vh-256px)]">
			<div className="flex flex-col items-center text-center">
				<Icon
					name="TriangleExclamationMark"
					size={24}
					className="text-text-unexpected"
				/>
				<h3 className="mt-2 text-sm font-medium text-gray-900">No results</h3>
				<p className="mt-1 text-sm text-gray-500">No results found!</p>
			</div>
		</div>
	);
};

interface RunsStatsErrorProps {
	error: unknown;
}

export const RunsStatsError = (props: RunsStatsErrorProps) => {
	const { error = {} } = props;
	const { title, description, status } = getErrorMessage(error);

	return (
		<div className="grid place-items-center h-[calc(100vh-256px)]">
			<div className="flex flex-col items-center text-center">
				<Icon
					name="TriangleExclamationMark"
					size={24}
					className="text-text-unexpected"
				/>
				<h3 className="mt-2 text-sm font-medium text-gray-900">
					{status} {title}
				</h3>
				<p className="mt-1 text-sm text-gray-500">{description}</p>
			</div>
		</div>
	);
};

export interface RunsStatsProps {
	stats: RunStats[];
}

export const RunsStats = ({ stats }: RunsStatsProps) => {
	return (
		<main className="flex flex-col bg-white rounded-md">
			<CardHeader label="Runs Stats" />
			<ConclusionSection stats={stats} />
			<TestsSection stats={stats} />
			<DaySection stats={stats} />
		</main>
	);
};
