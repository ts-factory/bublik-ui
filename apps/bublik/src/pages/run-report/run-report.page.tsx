/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { getRouteApi } from '@tanstack/react-router';

import { useRenderedLocation } from '@/router';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
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
import { BublikEmptyState } from '@/bublik/features/ui-state';

const runReportRoute = getRouteApi('/_app/runs/$runId/report');

function RunReportPage() {
	const runId = runReportRoute.useParams({ select: (params) => params.runId });
	const configId = runReportRoute.useSearch({
		select: (search) => search.config
	});
	const hasConfigId = configId !== undefined;
	const { pathname, searchStr } = useRenderedLocation();
	const { setLastVisited } = useRunSidebarState();
	useRunReportPageName({ runId });

	useEffect(() => {
		if (!hasConfigId) return;

		// The route only matches a numeric run id, so there always is one
		trackEvent(analyticsEventNames.runReportOpen, {
			hasRunId: true,
			hasConfigId
		});
	}, [hasConfigId, runId]);

	useEffect(() => {
		if (hasConfigId) {
			setLastVisited('report', pathname + searchStr, String(runId));
		}
	}, [runId, hasConfigId, pathname, searchStr, setLastVisited]);

	if (!hasConfigId) {
		return (
			<BublikEmptyState title="No data" description="Config ID is missing" />
		);
	}

	return (
		<div className="flex flex-col gap-1 p-2">
			<ReportStackedContextProvider runId={runId} configId={configId}>
				<RunReportContainer runId={runId} configId={configId} />
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
