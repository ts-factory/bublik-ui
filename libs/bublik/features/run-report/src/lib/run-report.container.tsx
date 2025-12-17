/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import {
	useGetRunDetailsQuery,
	useGetRunReportQuery
} from '@/services/bublik-api';
import { skipToken } from '@reduxjs/toolkit/query';

import {
	RunReport,
	RunReportEmpty,
	RunReportError,
	RunReportLoading
} from './run-report.component';

interface UseReportOptions {
	runId: number;
	configId: number;
}

function useReportData({ runId, configId }: UseReportOptions) {
	const { data, isLoading, error } = useGetRunReportQuery(
		configId && runId ? { configId, runId } : skipToken
	);
	const {
		data: details,
		isLoading: isDetailsLoading,
		error: detailsError
	} = useGetRunDetailsQuery(runId ?? skipToken);

	return {
		isLoading: isLoading || isDetailsLoading,
		details: details,
		blocks: data,
		error: error ?? detailsError
	};
}

interface RunReportContainerProps {
	runId: number;
	configId: number;
}

function RunReportContainer(props: RunReportContainerProps) {
	const { runId, configId } = props;

	const { details, blocks, error, isLoading } = useReportData({
		runId,
		configId
	});

	if (isLoading) return <RunReportLoading />;

	if (error) return <RunReportError error={error} />;

	if (!blocks || !details) return <RunReportEmpty />;

	return (
		<>
			<RunReport runId={Number(runId)} blocks={blocks} details={details} />;
		</>
	);
}

export { RunReportContainer };
