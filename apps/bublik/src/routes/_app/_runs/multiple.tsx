/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { RunMultiplePage } from '../../../pages/run-multiple';

export const Route = createFileRoute('/_app/_runs/multiple')({
	component: RunMultiplePage
});
