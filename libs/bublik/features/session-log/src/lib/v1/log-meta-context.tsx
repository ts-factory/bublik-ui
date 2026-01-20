/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createContext, useContext, type ReactNode } from 'react';

import type { RunDetailsAPIResponse } from '@/shared/types';

export interface LogMetaContextValue {
	runDetails?: RunDetailsAPIResponse;
}

const LogMetaContext = createContext<LogMetaContextValue>({});

export const useLogMetaContext = (): LogMetaContextValue => {
	const context = useContext(LogMetaContext);
	return context;
};

interface LogMetaContextProviderProps {
	runDetails?: RunDetailsAPIResponse;
	children: ReactNode;
}

export const LogMetaContextProvider = ({
	runDetails,
	children
}: LogMetaContextProviderProps) => {
	return (
		<LogMetaContext.Provider value={{ runDetails }}>
			{children}
		</LogMetaContext.Provider>
	);
};
