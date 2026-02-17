/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CardHeader, Skeleton } from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import { ConclusionSection, DaySection, TestsSection } from './components';
import { RunStats } from './runs-stats.types';

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
		<BublikEmptyState
			title="No results"
			description="No results found"
			className="h-[calc(100vh-256px)]"
		/>
	);
};

interface RunsStatsErrorProps {
	error: unknown;
}

export const RunsStatsError = (props: RunsStatsErrorProps) => {
	const { error = {} } = props;

	return <BublikErrorState error={error} className="h-[calc(100vh-256px)]" />;
};

export interface RunsStatsProps {
	stats: RunStats[];
}

export const RunsStats = ({ stats }: RunsStatsProps) => {
	return (
		<main className="flex flex-col gap-1">
			<div className="bg-white rounded-md">
				<CardHeader label="Conclusion Stats" />
				<ConclusionSection stats={stats} />
			</div>
			<div className="bg-white rounded-md">
				<CardHeader label="Tests Stats" />
				<TestsSection stats={stats} />
			</div>
			<div className="bg-white rounded-md">
				<CardHeader label="Day Stats" />
				<DaySection stats={stats} />
			</div>
		</main>
	);
};
