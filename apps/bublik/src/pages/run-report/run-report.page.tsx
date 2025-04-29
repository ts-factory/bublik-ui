/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useEffect } from 'react';

import { RunReportContainer } from '@/bublik/features/run-report';
import { useGetRunDetailsQuery } from '@/services/bublik-api';
import { formatTimeToDot } from '@/shared/utils';
import { useParams } from 'react-router-dom';
import { skipToken } from '@reduxjs/toolkit/query';

function RunReportPage() {
	const { runId } = useParams<{ runId: string }>();
	useRunReportPageName({ runId: runId ? Number(runId) : undefined });

	return (
		<div className="flex flex-col gap-1 p-2">
			<RunReportContainer />
		</div>
	);
}

interface UseRunReportPageNameConfig {
	runId?: number;
}

function useRunReportPageName({ runId }: UseRunReportPageNameConfig) {
	const { data: details } = useGetRunDetailsQuery(runId ?? skipToken);

	useEffect(() => {
		if (!runId) return;

		if (!details) {
			document.title = 'Report - Bublik';
			return;
		}

		const { main_package: name, start } = details;
		const formattedTime = formatTimeToDot(start);

		document.title = `${name} | ${formattedTime} | ${runId} | Report - Bublik`;
	}, [details, runId]);
}

export { RunReportPage };
