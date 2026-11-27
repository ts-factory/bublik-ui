/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { formatDistanceToNowStrict } from 'date-fns';

import { bublikAPI } from '@/services/bublik-api';
import { getRunStatusBgColor } from '@/shared/tailwind-ui';

import { getProjectLastRunQuery } from './project-order.hooks';
import { ProjectLastRun } from './project-switcher.component';

interface ProjectLastRunContainerProps {
	/** Left out for every project at once. */
	projectId?: number;
}

/* The Last Run order holds these queries for as long as the app is open, so
   they no longer expire while the switcher is closed: a row that mounts on
   an answer this old asks again. */
const LAST_RUN_MAX_AGE_SECONDS = 15 * 60;

function ProjectLastRunContainer({ projectId }: ProjectLastRunContainerProps) {
	const { data, isLoading, isError } = bublikAPI.useGetRunsTablePageQuery(
		getProjectLastRunQuery(projectId),
		{ refetchOnMountOrArgChange: LAST_RUN_MAX_AGE_SECONDS }
	);

	if (isLoading) return <ProjectLastRun state="loading" />;
	if (isError || !data) return <ProjectLastRun state="error" />;

	const lastRun = data.results.at(0);

	if (!lastRun) return <ProjectLastRun state="empty" />;

	return (
		<ProjectLastRun
			state="ready"
			age={formatDistanceToNowStrict(new Date(lastRun.start))}
			runCount={data.pagination.count}
			dotClassName={getRunStatusBgColor(lastRun.conclusion)}
		/>
	);
}

export { ProjectLastRunContainer };
