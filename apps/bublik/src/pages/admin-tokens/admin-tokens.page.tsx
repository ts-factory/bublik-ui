/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { AdminTokensTableContainer } from '@/bublik/features/access-tokens';
import { ClassificationToolbar } from '@/bublik/features/result-classification';
import { Tooltip } from '@/shared/tailwind-ui';

export const AdminTokensPage = () => {
	return (
		<div className="flex flex-col h-full gap-1 p-2">
			<div className="flex flex-col flex-1 min-h-0 rounded bg-bg-primary">
				<ClassificationToolbar>
					<Tooltip content="Every user's tokens. Values are never shown here — only their owner ever saw one, once.">
						<h1 className="text-[0.75rem] font-semibold leading-[0.875rem] text-text-primary">
							Access Tokens
						</h1>
					</Tooltip>
				</ClassificationToolbar>
				<AdminTokensTableContainer />
			</div>
		</div>
	);
};
