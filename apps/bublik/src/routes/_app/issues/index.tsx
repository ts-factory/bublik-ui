/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { IssuesPage } from '../../../pages/issues';
import { issuesSearch } from '../../-search/issues.search';

export const Route = createFileRoute('/_app/issues/')({
	validateSearch: issuesSearch.validateSearch,
	search: { middlewares: issuesSearch.middlewares },
	component: IssuesPage
});
