/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	createContext,
	Dispatch,
	PropsWithChildren,
	SetStateAction,
	useCallback,
	useContext
} from 'react';
import { createNextState } from '@reduxjs/toolkit';

import { ResultTableFilter } from '@/shared/types';

export type RowStateContextType = [
	RunRowState,
	Dispatch<SetStateAction<RunRowState>>
];

const RowStateContext = createContext<RowStateContextType | null>(null);

export type RunRowState = Record<string, RowState>;

export const RunRowStateContextProvider = (
	props: PropsWithChildren<{ value: RowStateContextType }>
) => {
	return (
		<RowStateContext.Provider value={props.value}>
			{props.children}
		</RowStateContext.Provider>
	);
};

export const useRunRowStateContext = () => {
	const context = useContext(RowStateContext);

	if (!context) throw new Error('No row state context!');

	return context;
};

export interface RowState {
	rowId: string;
	requests?: Record<string, ResultTableFilter>;
	referenceDiffRowId?: string;
}

export const useRunTableRowState = () => {
	const [rowState, setRowState] = useRunRowStateContext();

	const updateRowState = useCallback(
		(newState: RowState) => {
			setRowState((prev) =>
				createNextState(prev, (draft) => {
					draft[newState.rowId] = { ...newState };
				})
			);
		},
		[setRowState]
	);

	const updateRowsState = useCallback(
		(newState: RowState[]) => {
			setRowState((prev) =>
				createNextState(prev, (draft) => {
					newState.forEach((rowState) => (draft[rowState.rowId] = rowState));
				})
			);
		},
		[setRowState]
	);

	const deleteRows = useCallback(
		(rowIds: string[]) => {
			setRowState((prev) =>
				createNextState(prev, (draft) => {
					rowIds.forEach((rowId) => delete draft[rowId]);
				})
			);
		},
		[setRowState]
	);

	const expandAllUnexpected = useCallback(
		(payload: Record<string, RowState>) => {
			setRowState(payload);
		},
		[setRowState]
	);

	const resetRowState = useCallback(() => setRowState({}), [setRowState]);

	return {
		rowState,
		updateRowState,
		updateRowsState,
		resetRowState,
		deleteRows,
		expandAllUnexpected
	};
};
