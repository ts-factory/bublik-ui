/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { RunsLayout } from '../../pages/runs-layout';

// Pathless layout: the runs list, compare and multiple pages share the selection popover.
export const Route = createFileRoute('/_app/_runs')({
	component: RunsLayout
});
