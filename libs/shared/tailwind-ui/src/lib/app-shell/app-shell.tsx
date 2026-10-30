/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	CSSProperties,
	PropsWithChildren,
	ReactNode,
	useCallback,
	ComponentType
} from 'react';
import { useHotkey } from '@tanstack/react-hotkeys';

import {
	type PageLayout,
	useLocalStorage,
	usePhysicalHotkeys
} from '@/shared/hooks';

import { SidebarProvider, useSidebar } from './context';
import { cn } from '../utils';

const SidebarStory = () => {
	const { isSidebarOpen } = useSidebar();

	return (
		<div
			className={cn(
				'sticky top-0 z-20 h-screen bg-bg-primary',
				isSidebarOpen ? 'w-[245px]' : 'w-[49px]'
			)}
		/>
	);
};

export const withSidebar = (hideSidebar?: boolean) => {
	return (Story: ComponentType) => (
		<AppShell
			sidebar={hideSidebar ? null : <SidebarStory />}
			hideSidebar={hideSidebar}
		>
			<Story />
		</AppShell>
	);
};

export interface AppShellProps {
	sidebar: ReactNode;
	hideSidebar?: boolean;
	/** Whether and where the page is capped to `--page-max-width` */
	layout?: PageLayout;
}

/**
 * `--page-max-width` caps the sidebar and the page together, so the page gets
 * what the sidebar leaves. It resizes along with the sidebar's own animation,
 * which keeps the page's right edge still while the sidebar opens or closes
 */
const CAPPED_PAGE_CLASS =
	'w-full max-w-[calc(var(--page-max-width)_-_var(--shell-sidebar-width))] [transition:max-width_0.5s_ease]';

/**
 * Centers the sidebar and the capped page as one group: the shell is padded
 * by half the room they leave. Padding the shell, not the page container,
 * keeps the scroller reaching the right edge, so the gutter scrolls the page
 */
const CENTERED_SHELL_PADDING = 'max(0px, (100vw - var(--page-max-width)) / 2)';

export const AppShell = ({
	sidebar,
	hideSidebar = false,
	layout = 'full',
	children
}: PropsWithChildren<AppShellProps>) => {
	const [isSidebarOpen, setIsSidebarOpen] = useLocalStorage(
		'sidebar-open',
		false
	);

	const isSidebarVisible = !hideSidebar;

	const toggleSidebar = useCallback(() => {
		if (!isSidebarVisible) return;

		setIsSidebarOpen(!isSidebarOpen);
	}, [isSidebarOpen, isSidebarVisible, setIsSidebarOpen]);

	usePhysicalHotkeys(
		[
			{
				code: 'KeyS',
				callback: toggleSidebar,
				options: { enabled: isSidebarVisible }
			}
		],
		{
			ignoreInputs: true,
			preventDefault: true,
			requireReset: true
		}
	);

	const sidebarWidth = !isSidebarVisible
		? '0px'
		: isSidebarOpen
		? 'var(--sidebar-width-open)'
		: 'var(--sidebar-width-closed)';

	const shellStyle = {
		'--shell-sidebar-width': sidebarWidth,
		paddingLeft: layout === 'centered' ? CENTERED_SHELL_PADDING : undefined
	} as CSSProperties;

	return (
		<div
			className="relative flex h-full"
			style={shellStyle}
			data-testid="tw-app-shell"
		>
			<SidebarProvider
				isSidebarOpen={isSidebarVisible ? isSidebarOpen : false}
				toggleSidebar={toggleSidebar}
			>
				{isSidebarVisible ? (
					<div className="sticky top-0 z-20 h-screen h-svh" id="sidebar">
						{sidebar}
					</div>
				) : null}
				<div className="flex-grow overflow-auto" id="page-container">
					{/* Always rendered, so switching the layout keeps the page mounted */}
					<div
						id="page-content"
						className={cn(
							'h-full',
							layout === 'sidebar-left' && cn('mx-auto', CAPPED_PAGE_CLASS),
							layout === 'centered' && cn('mr-auto', CAPPED_PAGE_CLASS)
						)}
					>
						{children}
					</div>
				</div>
			</SidebarProvider>
		</div>
	);
};
