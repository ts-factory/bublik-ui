/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { idParams } from '@/router';

import { NoMatchFeature } from '../../../pages/not-found-page';
import { IssuePage } from '../../../pages/issue';
import { issueSearch } from '../../-search/issue.search';

export const Route = createFileRoute('/_app/issues/$issueId')({
	params: idParams('issueId'),
	validateSearch: issueSearch.validateSearch,
	search: { middlewares: issueSearch.middlewares },
	notFoundComponent: NoMatchFeature,
	component: IssuePage
});
