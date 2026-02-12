/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useEffect } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { useParams, useSearchParams, useLocation } from 'react-router-dom';

import { useRunSidebarState } from '@/bublik/features/run';
import {
	ReportStackedContextProvider,
	RunReportContainer,
	RunReportStackedSelectedContainer,
	RunReportStackedChartContainer
} from '@/bublik/features/run-report';
import { formatTimeToDot } from '@/shared/utils';
import { useGetRunDetailsQuery } from '@/services/bublik-api';

import { useTabTitleWithPrefix } from '@/bublik/features/projects';

function RunReportPage() {
	const [searchParams] = useSearchParams();
	const { runId } = useParams<{ runId: string }>();
	const location = useLocation();
	const configId = searchParams.get('config');
	const { setLastVisited } = useRunSidebarState();
	useRunReportPageName({ runId: runId ? Number(runId) : undefined });

	useEffect(() => {
		if (runId && configId) {
			setLastVisited('report', location.pathname + location.search, runId);
		}
	}, [runId, configId, location.pathname, location.search, setLastVisited]);

	if (!configId) {
		return <div className="flex flex-col gap-1 p-2">No config id found!</div>;
	}

	if (!runId) {
		return <div className="flex flex-col gap-1 p-2">No run id found!</div>;
	}

	return (
		<div className="flex flex-col gap-1 p-2">
			<ReportStackedContextProvider
				runId={Number(runId)}
				configId={Number(configId)}
			>
				<RunReportContainer runId={Number(runId)} configId={Number(configId)} />
				<RunReportStackedSelectedContainer />
				<RunReportStackedChartContainer />
			</ReportStackedContextProvider>
		</div>
	);
}

interface UseRunReportPageNameConfig {
	runId?: number;
}

function useRunReportPageName({ runId }: UseRunReportPageNameConfig) {
	const { data: details } = useGetRunDetailsQuery(runId ?? skipToken);

	let title = 'Report - Bublik';

	if (runId && details) {
		const { main_package: name, start } = details;
		const formattedTime = formatTimeToDot(start);
		title = `${name} | ${formattedTime} | ${runId} | Report - Bublik`;
	}

	useTabTitleWithPrefix(title);
}

export { RunReportPage };
