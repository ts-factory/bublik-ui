/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute, Outlet } from '@tanstack/react-router';

import { Layout } from '../app/layout';

function AppLayout() {
	return (
		<Layout>
			<Outlet />
		</Layout>
	);
}

// Pathless layout: every page but the auth pages renders inside the app
// shell. Its own error and not-found components arrive with the shell
// switch (#62); the router's defaults cover it until then.
export const Route = createFileRoute('/_app')({
	component: AppLayout
});
