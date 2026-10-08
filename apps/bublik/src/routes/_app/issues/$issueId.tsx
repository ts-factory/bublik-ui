/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { IssuePage } from '../../../pages/issue';
import { issueSearch } from '../../-search/issue.search';

export const Route = createFileRoute('/_app/issues/$issueId')({
	validateSearch: issueSearch.validateSearch,
	search: { middlewares: issueSearch.middlewares },
	component: IssuePage
});
