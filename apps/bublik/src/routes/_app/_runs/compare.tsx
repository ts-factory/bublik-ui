/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { RunDiffPage } from '../../../pages/run-diff-page';
import { compareSearch } from '../../-search/compare.search';

export const Route = createFileRoute('/_app/_runs/compare')({
	validateSearch: compareSearch.validateSearch,
	search: { middlewares: compareSearch.middlewares },
	component: RunDiffPage
});
