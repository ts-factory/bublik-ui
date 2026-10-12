/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute, Outlet } from '@tanstack/react-router';

import { AuthLayout } from '../../pages/auth';

function AuthRoute() {
	return (
		<AuthLayout>
			<Outlet />
		</AuthLayout>
	);
}

// The auth pages render without the app shell.
export const Route = createFileRoute('/auth')({
	component: AuthRoute
});
