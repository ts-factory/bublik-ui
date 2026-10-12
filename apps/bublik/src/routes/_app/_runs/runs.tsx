/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { RunsPage } from '../../../pages/runs-page';
import { runsSearch } from '../../-search/runs.search';

export const Route = createFileRoute('/_app/_runs/runs')({
	validateSearch: runsSearch.validateSearch,
	search: { middlewares: runsSearch.middlewares },
	component: RunsPage
});
