/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useSearchParams, useParams } from 'react-router-dom';

import { useGetRunReportQuery } from '@/services/bublik-api';

import {
	RunReport,
	RunReportEmpty,
	RunReportError,
	RunReportLoading
} from './run-report.component';
import { skipToken } from '@reduxjs/toolkit/query';

function RunReportContainer() {
	const { runId } = useParams<{ runId: string }>();
	const [searchParams] = useSearchParams();
	const configId = searchParams.get('config');

	const { data, isLoading, error } = useGetRunReportQuery(
		configId && runId ? { configId, runId } : skipToken
	);

	if (!configId) return;
	if (!runId) return;

	if (isLoading) return <RunReportLoading />;

	if (error) return <RunReportError error={error} />;

	if (!data) return <RunReportEmpty />;

	return <RunReport blocks={data} />;
}

export { RunReportContainer };
