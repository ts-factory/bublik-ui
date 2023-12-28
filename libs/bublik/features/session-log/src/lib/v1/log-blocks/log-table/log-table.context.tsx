/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	createContext,
	PropsWithChildren,
	useContext,
	useMemo,
	useState
} from 'react';
import { PaginationState, Row, Table } from '@tanstack/react-table';

import { LogTableData } from '@/shared/types';

export interface LogTableContext {
	onLineNumberClick?: (id: string, lineNumber: number) => void;
	onLogTableMount?: (id: string, table: Table<LogTableData>) => void;
	onLogTableUnmount?: (id: string, table: Table<LogTableData>) => void;
	onPageClick?: (id: string, page: number) => void;
}

export const LogTableContext = createContext<LogTableContext | null>(null);

export type LogTableContextProviderProps = PropsWithChildren<LogTableContext>;

export const LogTableContextProvider = ({
	children,
	...props
}: LogTableContextProviderProps) => {
	return (
		<LogTableContext.Provider value={props}>
			{children}
		</LogTableContext.Provider>
	);
};

export const useLogTableContext = () => {
	return useContext(LogTableContext);
};

export type LogTablePaginationContext = {
	pagination?: { state: PaginationState; totalCount: number };
};

export const LogTablePaginationContext =
	createContext<LogTablePaginationContext | null>(null);

export type LogTablePaginationContextProviderProps =
	PropsWithChildren<LogTablePaginationContext>;

export const LogTablePaginationContextProvider = ({
	children,
	...props
}: LogTablePaginationContextProviderProps) => {
	return (
		<LogTablePaginationContext.Provider value={props}>
			{children}
		</LogTablePaginationContext.Provider>
	);
};

export const useLogTablePaginationContext = () => {
	return useContext(LogTablePaginationContext);
};

interface TimestampDeltaContext {
	anchorRow: Row<LogTableData>;
	setAnchorRow: (row: Row<LogTableData>) => void;
	resetAnchorRow: () => void;
}

const DeltaContext = createContext<TimestampDeltaContext | null>(null);

export const DeltaContextProvider = ({
	children,
	...props
}: PropsWithChildren<{ value: TimestampDeltaContext }>) => {
	return (
		<DeltaContext.Provider value={props.value}>
			{children}
		</DeltaContext.Provider>
	);
};

export const useDeltaContext = () => {
	const api = useContext(DeltaContext);

	if (!api) {
		throw new Error(
			`useDelta context must be used inside <DeltaContextProvider />`
		);
	}

	return api;
};

export type UseDeltaContextParams = {
	table: Table<LogTableData>;
};

export const useDelta = (
	params: UseDeltaContextParams
): TimestampDeltaContext => {
	const { table } = params;

	const firstRow = useMemo(
		() => table.getPreFilteredRowModel().flatRows[0],
		[table]
	);

	const [anchorRow, setAnchorRowS] = useState<Row<LogTableData>>(firstRow);

	const setAnchorRow = (row: Row<LogTableData>) => setAnchorRowS(row);

	const resetAnchorRow = () => setAnchorRowS(firstRow);

	return { resetAnchorRow, setAnchorRow, anchorRow };
};
