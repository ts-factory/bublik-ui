/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren, ReactNode, useCallback } from 'react';
import { StoryFn } from '@storybook/react';

import { useLocalStorage, useKey } from '@/shared/hooks';
import { isFocusInInput } from '@/shared/utils';

import { SidebarProvider, useSidebar } from './context';
import { cn } from '../utils';

const SidebarStory = () => {
	const { isSidebarOpen } = useSidebar();

	return (
		<div
			className={cn(
				'sticky top-0 z-20 h-screen bg-white',
				isSidebarOpen ? 'w-[245px]' : 'w-[49px]'
			)}
		/>
	);
};

export const withSidebar = (hideSidebar?: boolean) => {
	return (Story: StoryFn) => (
		<AppShell sidebar={hideSidebar ? null : <SidebarStory />}>
			<Story />
		</AppShell>
	);
};

export interface AppShellProps {
	sidebar: ReactNode;
}

export const AppShell = ({
	sidebar,
	children
}: PropsWithChildren<AppShellProps>) => {
	const [isSidebarOpen, setIsSidebarOpen] = useLocalStorage(
		'sidebar-open',
		false
	);

	const toggleSidebar = useCallback(
		() => setIsSidebarOpen(!isSidebarOpen),
		[isSidebarOpen, setIsSidebarOpen]
	);

	useKey(
		(e) => e.code === 'KeyS' && !e.ctrlKey && !e.metaKey && !isFocusInInput(e),
		toggleSidebar,
		{ event: 'keypress' }
	);

	return (
		<div className="relative flex h-full" data-testid="tw-app-shell">
			<SidebarProvider
				isSidebarOpen={isSidebarOpen}
				toggleSidebar={toggleSidebar}
			>
				<div className="sticky top-0 z-20 h-screen h-svh" id="sidebar">
					{sidebar}
				</div>
				<div className="flex-grow overflow-auto" id="page-container">
					{children}
				</div>
			</SidebarProvider>
		</div>
	);
};
