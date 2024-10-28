/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useParams, useSearchParams } from 'react-router-dom';

import { useGetRunReportQuery } from '@/services/bublik-api';
import { skipToken } from '@reduxjs/toolkit/query';

import {
	RunReport,
	RunReportEmpty,
	RunReportError,
	RunReportLoading
} from './run-report.component';

function RunReportContainer() {
	const { runId } = useParams<{ runId: string }>();
	const [searchParams] = useSearchParams();
	const configId = searchParams.get('config');
	const { data, isLoading, error } = useGetRunReportQuery(
		configId && runId ? { configId, runId } : skipToken
	);

	if (!configId) return <div>No config id found!</div>;
	if (!runId) return <div>No run id found!</div>;

	if (isLoading) return <RunReportLoading />;

	if (error) return <RunReportError error={error} />;

	if (!data) return <RunReportEmpty />;

	return <RunReport blocks={data} />;
}

export { RunReportContainer };
