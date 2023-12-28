/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { createContext, FC, useContext } from 'react';
import { ReactNode } from 'react';

export interface RowDecription {
	packageIds: string[];
	allIds: string[];
	testIds: string[];
}

export interface AllRowsContext {
	rowsIds: Record<string, RowDecription>;
	rowsValues: Record<string, Record<string, unknown>>;
}

export const RowValuesContext = createContext<AllRowsContext | null>(null);

export const RowValuesContextProvider: FC<{
	value: AllRowsContext;
	children?: ReactNode;
}> = ({ value, children }) => {
	return (
		<RowValuesContext.Provider value={value}>
			{children}
		</RowValuesContext.Provider>
	);
};

export const useRowsContext = () => {
	const context = useContext(RowValuesContext);

	if (!context) throw new Error('No rows context ;(');

	return context;
};
