/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute, redirect } from '@tanstack/react-router';

// `/` goes to the dashboard with the search kept and the hash dropped,
// replacing the history entry, as `RedirectToDashboard` does today.
export const Route = createFileRoute('/_app/')({
	beforeLoad: () => {
		throw redirect({ to: '/dashboard', search: true, replace: true });
	}
});
