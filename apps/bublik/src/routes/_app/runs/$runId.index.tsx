/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { RunPage } from '../../../pages/run-page';
import { runSearch } from '../../-search/run.search';

export const Route = createFileRoute('/_app/runs/$runId/')({
	validateSearch: runSearch.validateSearch,
	search: { middlewares: runSearch.middlewares },
	component: RunPage
});
