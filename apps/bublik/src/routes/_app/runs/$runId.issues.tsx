/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { RunIssuesPage } from '../../../pages/run-issues';

export const Route = createFileRoute('/_app/runs/$runId/issues')({
	component: RunIssuesPage
});
