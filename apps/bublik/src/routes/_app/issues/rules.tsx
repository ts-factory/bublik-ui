/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { IssueRulesListPage } from '../../../pages/issue-rules-list';
import { issueRulesSearch } from '../../-search/issue-rules.search';

export const Route = createFileRoute('/_app/issues/rules')({
	validateSearch: issueRulesSearch.validateSearch,
	search: { middlewares: issueRulesSearch.middlewares },
	component: IssueRulesListPage
});
