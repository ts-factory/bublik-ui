/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { createContext, FC, useContext, useMemo } from 'react';

export type StickyMode = 'sticky' | 'not-sticky';

export interface StickyModeContext {
	mode: StickyMode;
	isSticky: boolean;
	chartHeight: number;
	toggleMode: () => void;
}

const StickyModeContext = createContext<StickyModeContext | null>(null);

export type StickyModeProviderProps = StickyModeContext;

export const StickyModeProvider: FC<StickyModeContext> = ({
	children,
	chartHeight,
	isSticky,
	mode,
	toggleMode
}) => {
	const value = useMemo<StickyModeContext>(() => {
		return {
			mode,
			chartHeight,
			isSticky,
			toggleMode
		};
	}, [chartHeight, isSticky, mode, toggleMode]);

	return (
		<StickyModeContext.Provider value={value}>
			{children}
		</StickyModeContext.Provider>
	);
};

export const useStickyMode = () => {
	const context = useContext(StickyModeContext);

	if (!context) {
		throw new Error('useStickyMode must be used within a StickyModeProvider');
	}

	return context;
};
