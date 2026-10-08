/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { IssueRulesListPage } from '../../../pages/issue-rules-list';

export const Route = createFileRoute('/_app/issues/rules')({
	component: IssueRulesListPage
});
