/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { idParams } from '@/router';

import { NoMatchFeature } from '../../../pages/not-found-page';
import { IssueResultsPage } from '../../../pages/issue-results';
import { issueResultsSearch } from '../../-search/issue-results.search';

export const Route = createFileRoute('/_app/issues/$issueId_/results')({
	params: idParams('issueId'),
	validateSearch: issueResultsSearch.validateSearch,
	search: { middlewares: issueResultsSearch.middlewares },
	notFoundComponent: NoMatchFeature,
	component: IssueResultsPage
});
