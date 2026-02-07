/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren, Suspense } from 'react';

import { AppShell, ErrorBoundary, Spinner } from '@/shared/tailwind-ui';
import { SidebarContainer } from './sidebar-container';

export const Layout = (props: PropsWithChildren) => {
	return (
		<AppShell sidebar={<SidebarContainer />}>
			<ErrorBoundary>
				<Suspense fallback={<Spinner className="h-screen" />}>
					{props.children}
				</Suspense>
			</ErrorBoundary>
		</AppShell>
	);
};
