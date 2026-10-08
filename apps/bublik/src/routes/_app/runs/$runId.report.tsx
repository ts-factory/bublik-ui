/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { RunReportPage } from '../../../pages/run-report';
import { runReportSearch } from '../../-search/run-report.search';

export const Route = createFileRoute('/_app/runs/$runId/report')({
	validateSearch: runReportSearch.validateSearch,
	search: { middlewares: runReportSearch.middlewares },
	component: RunReportPage
});
