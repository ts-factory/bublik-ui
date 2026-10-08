/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { RunDiffPage } from '../../../pages/run-diff-page';

export const Route = createFileRoute('/_app/_runs/compare')({
	component: RunDiffPage
});
