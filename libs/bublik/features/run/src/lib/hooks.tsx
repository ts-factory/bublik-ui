/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	createContext,
	Dispatch,
	PropsWithChildren,
	SetStateAction,
	useCallback,
	useContext,
	useMemo,
	useState
} from 'react';
import { createNextState } from '@reduxjs/toolkit';

import { ResultTableFilter } from '@/shared/types';

import { useRunTableSetter, useRunTableValue } from './run-search.hooks';

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

interface GlobalRequirementsContextType {
	globalRequirements: string[];
	setGlobalRequirements: (value: string[]) => void;
	resetGlobalRequirements: () => void;
	localRequirements: string[];
	setLocalRequirements: (value: string[]) => void;
}

const GlobalRequirementsContext =
	createContext<GlobalRequirementsContextType | null>(null);

const NO_REQUIREMENTS: string[] = [];

/**
 * The requirements applied to the whole run, from the repeated
 * `globalRequirements` key, written with replace and merge.
 */
export const GlobalRequirementsProvider = ({ children }: PropsWithChildren) => {
	const globalRequirements =
		useRunTableValue('globalRequirements') ?? NO_REQUIREMENTS;
	const setGlobalRequirements = useRunTableSetter('globalRequirements');

	const [localRequirements, setLocalRequirements] =
		useState<string[]>(globalRequirements);

	const resetGlobalRequirements = useCallback(() => {
		setGlobalRequirements([]);
	}, [setGlobalRequirements]);

	const value = useMemo(
		() => ({
			globalRequirements,
			setGlobalRequirements,
			resetGlobalRequirements,
			localRequirements,
			setLocalRequirements
		}),
		[
			globalRequirements,
			setGlobalRequirements,
			resetGlobalRequirements,
			localRequirements
		]
	);

	return (
		<GlobalRequirementsContext.Provider value={value}>
			{children}
		</GlobalRequirementsContext.Provider>
	);
};

export const useGlobalRequirements = () => {
	const context = useContext(GlobalRequirementsContext);

	if (!context) {
		throw new Error(
			'useGlobalRequirements must be used within a GlobalRequirementsProvider'
		);
	}

	return context;
};
