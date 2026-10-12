/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { ProtectedRoute } from '@/bublik/features/auth';

// Pathless layout: shows the sign-in dialog in place instead of redirecting.
export const Route = createFileRoute('/_app/_protected')({
	component: ProtectedRoute
});
