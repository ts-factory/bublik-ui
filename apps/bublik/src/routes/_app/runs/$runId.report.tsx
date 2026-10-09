/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { idParams } from '@/router';

import { NoMatchFeature } from '../../../pages/not-found-page';
import { RunReportPage } from '../../../pages/run-report';
import { loadRunReport } from '../../-loaders';
import { runReportSearch } from '../../-search/run-report.search';

export const Route = createFileRoute('/_app/runs/$runId/report')({
	params: idParams('runId'),
	validateSearch: runReportSearch.validateSearch,
	search: { middlewares: runReportSearch.middlewares },
	loaderDeps: ({ search }) => ({ config: search.config }),
	loader: loadRunReport,
	notFoundComponent: NoMatchFeature,
	component: RunReportPage
});
