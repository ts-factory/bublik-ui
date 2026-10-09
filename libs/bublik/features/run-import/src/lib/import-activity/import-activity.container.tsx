/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useAuth } from '@/bublik/features/auth';
import { useSidebar } from '@/shared/tailwind-ui';

import { useActiveImports } from './import-activity.hooks';
import { ImportActivityIndicator } from './import-activity.component';

function ImportActivityIndicatorContainer() {
	const { user } = useAuth();
	const { isSidebarOpen } = useSidebar();
	const { imports, total } = useActiveImports({ enabled: Boolean(user) });

	if (total === 0) return null;

	return (
		<ImportActivityIndicator
			imports={imports}
			total={total}
			isSidebarOpen={Boolean(isSidebarOpen)}
		/>
	);
}

export { ImportActivityIndicatorContainer };
