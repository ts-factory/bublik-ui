/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { RunPage } from '../../../pages/run-page';

export const Route = createFileRoute('/_app/runs/$runId/')({
	component: RunPage
});
