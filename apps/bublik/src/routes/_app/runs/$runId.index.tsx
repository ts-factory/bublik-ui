/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { idParams } from '@/router';

import { NoMatchFeature } from '../../../pages/not-found-page';
import { RunPage } from '../../../pages/run-page';
import { loadRun } from '../../-loaders';
import { runSearch } from '../../-search/run.search';

export const Route = createFileRoute('/_app/runs/$runId/')({
	params: idParams('runId'),
	validateSearch: runSearch.validateSearch,
	search: { middlewares: runSearch.middlewares },
	loaderDeps: ({ search }) => ({ requirements: search.globalRequirements }),
	loader: loadRun,
	notFoundComponent: NoMatchFeature,
	component: RunPage
});
