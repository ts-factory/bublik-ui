/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { ProtectedRoute } from '@/bublik/features/auth';

function AdminOnly() {
	return <ProtectedRoute access="admin" />;
}

// Pathless layout: the admin-only pages show the sign-in dialog in place.
export const Route = createFileRoute('/_app/admin/_admin')({
	component: AdminOnly
});
