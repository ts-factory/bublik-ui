/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { formatDistanceToNowStrict } from 'date-fns';

import { bublikAPI } from '@/services/bublik-api';
import { getRunStatusBgColor } from '@/shared/tailwind-ui';

import { ProjectLastRun } from './project-switcher.component';

interface ProjectLastRunContainerProps {
	/** Left out for every project at once. */
	projectId?: number;
}

/* One run is enough: the list is ordered by start, newest first, and its
   pagination counts every run the project has. */
function ProjectLastRunContainer({ projectId }: ProjectLastRunContainerProps) {
	const { data, isLoading, isError } = bublikAPI.useGetRunsTablePageQuery({
		projects: projectId === undefined ? undefined : [projectId],
		pageSize: '1'
	});

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
