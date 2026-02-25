/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';

import { AppShell, ErrorBoundary, Spinner } from '@/shared/tailwind-ui';
import { HIDE_SIDEBAR_QUERY_KEY } from '@/bublik/features/projects';
import { Sidebar } from '@/bublik/features/sidebar';

const parseHideSidebarQuery = (value: string | null) => {
	if (!value) return null;

	const normalizedValue = value.toLowerCase();

	if (normalizedValue === '1' || normalizedValue === 'true') return true;
	if (normalizedValue === '0' || normalizedValue === 'false') return false;

	return null;
};

export const Layout = (props: PropsWithChildren) => {
	const [searchParams] = useSearchParams();
	const queryValue = searchParams.get(HIDE_SIDEBAR_QUERY_KEY);
	const parsedQueryValue = parseHideSidebarQuery(queryValue);
	const hideSidebar = parsedQueryValue ?? false;

	return (
		<AppShell sidebar={<Sidebar />} hideSidebar={hideSidebar}>
			<ErrorBoundary>
				<Suspense fallback={<Spinner className="h-screen" />}>
					{props.children}
				</Suspense>
			</ErrorBoundary>
		</AppShell>
	);
};
