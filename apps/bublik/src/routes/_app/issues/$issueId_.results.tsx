/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { IssueResultsPage } from '../../../pages/issue-results';
import { issueResultsSearch } from '../../-search/issue-results.search';

export const Route = createFileRoute('/_app/issues/$issueId_/results')({
	validateSearch: issueResultsSearch.validateSearch,
	search: { middlewares: issueResultsSearch.middlewares },
	component: IssueResultsPage
});
