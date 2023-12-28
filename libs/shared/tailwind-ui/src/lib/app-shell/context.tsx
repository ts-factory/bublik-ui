/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { createContext, FC, ReactNode, useContext } from 'react';

export interface SidebarContext {
	isSidebarOpen?: boolean;
	toggleSidebar?: () => void;
}

export const SidebarContext = createContext<SidebarContext | null>(null);
SidebarContext.displayName = 'SidebarContext';

export const useSidebar = () => {
	const context = useContext(SidebarContext);

	if (!context) {
		throw new Error('useSidebar must be used within a SidebarContextProvider');
	}

	return context;
};

export interface SidebarProviderProps extends SidebarContext {
	children?: ReactNode;
}

export const SidebarProvider: FC<SidebarProviderProps> = ({
	isSidebarOpen = true,
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	toggleSidebar = () => {},
	children
}) => {
	return (
		<SidebarContext.Provider value={{ isSidebarOpen, toggleSidebar }}>
			{children}
		</SidebarContext.Provider>
	);
};
