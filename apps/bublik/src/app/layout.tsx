/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren, Suspense } from 'react';

import { AppShell, ErrorBoundary, Spinner } from '@/shared/tailwind-ui';
import { Sidebar } from '@/bublik/features/sidebar';

export const Layout = (props: PropsWithChildren) => {
	return (
		<AppShell sidebar={<Sidebar />}>
			<ErrorBoundary>
				<Suspense fallback={<Spinner className="h-screen" />}>
					{props.children}
				</Suspense>
			</ErrorBoundary>
		</AppShell>
	);
};
