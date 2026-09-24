/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { AdminTokensTableContainer } from '@/bublik/features/access-tokens';

export const AdminTokensPage = () => {
	return (
		<div className="p-2">
			<header className="px-6 py-4 bg-white rounded-t-xl">
				<h1 className="text-xl font-semibold text-text-primary">
					Access tokens
				</h1>
				<p className="mt-1 text-sm text-text-menu">
					Every user's tokens. Values are never shown here — only their owner
					ever saw one, once.
				</p>
			</header>
			<div>
				<AdminTokensTableContainer />
			</div>
		</div>
	);
};
