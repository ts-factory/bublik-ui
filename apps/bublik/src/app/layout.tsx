/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren, Suspense } from 'react';
import { useSearch } from '@tanstack/react-router';

import { AppShell, ErrorBoundary, Spinner } from '@/shared/tailwind-ui';
import { HIDE_SIDEBAR_QUERY_KEY } from '@/bublik/features/projects';
import { SidebarContainer } from './sidebar-container';

const parseHideSidebarQuery = (value: string | null) => {
	if (!value) return null;

	const normalizedValue = value.toLowerCase();

	if (normalizedValue === '1' || normalizedValue === 'true') return true;
	if (normalizedValue === '0' || normalizedValue === 'false') return false;

	return null;
};

export const Layout = (props: PropsWithChildren) => {
	const value = useSearch({
		strict: false,
		// `passthrough()` on the root route: the wire value as is
		select: (search) =>
			search[HIDE_SIDEBAR_QUERY_KEY] as string | string[] | undefined
	});
	// The first of repeated keys, as `URLSearchParams.get` read it
	const queryValue = (Array.isArray(value) ? value[0] : value) ?? null;
	const parsedQueryValue = parseHideSidebarQuery(queryValue);
	const hideSidebar = parsedQueryValue ?? false;

	return (
		<AppShell sidebar={<SidebarContainer />} hideSidebar={hideSidebar}>
			<ErrorBoundary>
				<Suspense fallback={<Spinner className="h-screen" />}>
					{props.children}
				</Suspense>
			</ErrorBoundary>
		</AppShell>
	);
};
