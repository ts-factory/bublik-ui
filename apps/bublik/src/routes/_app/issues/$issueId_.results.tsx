/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { IssueResultsPage } from '../../../pages/issue-results';

export const Route = createFileRoute('/_app/issues/$issueId_/results')({
	component: IssueResultsPage
});
