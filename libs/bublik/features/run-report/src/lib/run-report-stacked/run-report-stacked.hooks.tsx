/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2025 OKTET LTD */
import { useMemo, createContext, useContext, useCallback } from 'react';
import {
	ArrayParam,
	BooleanParam,
	useQueryParam,
	withDefault
} from 'use-query-params';

import { useGetRunReportQuery } from '@/services/bublik-api';

import {
	SELECTED_RECORDS_FOR_STACKED_KEY,
	STACKED_DRAWER_KEY
} from './run-report-stacked.constants';
import { Icon, ToolbarButton, Tooltip } from '@/shared/tailwind-ui';
import {
	ArgsValBlock,
	MeasurementBlock,
	RecordBlock,
	ReportChart
} from '@/shared/types';

export type RecordWithContext = RecordBlock & {
	chart?: ReportChart;
	argsVals: ArgsValBlock;
	measurement: MeasurementBlock;
};

interface RunReportStackedContextValue {
	selectedIds: string[];
	selectedIdSet: Set<string>;
	selectedRecords: RecordWithContext[];
	isStackedOpen: boolean;
	addId: (id: string) => void;
	removeId: (id: string) => void;
	clearIds: () => void;
	toggleId: (id: string) => void;
	toggleStacked: (open?: boolean) => void;
}

type ReportStackedContextProviderProps = {
	runId: number;
	configId: number;
	children: React.ReactNode;
};

const stackedContext = createContext<RunReportStackedContextValue | null>(null);

function useRunReportStackedContext() {
	const context = useContext(stackedContext);

	if (!context) {
		throw new Error(
			'useRunReportStackedContext must be used within a StackedContextProvider'
		);
	}

	return context;
}

function useRunReportStackedState(runId: number, configId: number) {
	const [_selectedIds = [], _setSelectedIds] = useQueryParam(
		SELECTED_RECORDS_FOR_STACKED_KEY,
		withDefault(ArrayParam, [])
	);
	const [isStackedOpen = false, setIsStackedOpen] = useQueryParam(
		STACKED_DRAWER_KEY,
		withDefault(BooleanParam, false)
	);
	const selectedIds = useMemo(
		() => _selectedIds.filter((id): id is string => id !== null),
		[_selectedIds]
	);
	const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
	const { data } = useGetRunReportQuery({ runId, configId });

	const records = useMemo<RecordWithContext[]>(() => {
		if (!data) return [];

		const recordsWithContext: RecordWithContext[] = [];

		for (const testBlock of data.content) {
			for (const argsVals of testBlock.content) {
				for (const measurement of argsVals.content) {
					for (const record of measurement.content) {
						if (!record.chart) continue;

						recordsWithContext.push({
							...record,
							argsVals,
							measurement
						});
					}
				}
			}
		}

		return recordsWithContext;
	}, [data]);

	const toggleStacked = useCallback(
		(open?: boolean) => {
			if (open === undefined) {
				setIsStackedOpen(!isStackedOpen);
				return;
			}

			setIsStackedOpen(open);
		},
		[isStackedOpen, setIsStackedOpen]
	);

	const addId = useCallback(
		(id: string) => {
			if (selectedIdSet.has(id)) return;

			_setSelectedIds([...selectedIds, id]);
		},
		[_setSelectedIds, selectedIdSet, selectedIds]
	);

	const removeId = useCallback(
		(id: string) => {
			if (!selectedIdSet.has(id)) return;

			_setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
		},
		[_setSelectedIds, selectedIdSet, selectedIds]
	);

	const clearIds = useCallback(() => {
		_setSelectedIds([]);
	}, [_setSelectedIds]);

	const toggleId = useCallback(
		(id: string) => {
			if (selectedIdSet.has(id)) {
				removeId(id);
				return;
			}

			addId(id);
		},
		[addId, removeId, selectedIdSet]
	);

	const selectedRecords = useMemo(
		() => records.filter((record) => selectedIdSet.has(record.id)),
		[records, selectedIdSet]
	);

	return useMemo<RunReportStackedContextValue>(
		() => ({
			selectedIds,
			selectedIdSet,
			selectedRecords,
			isStackedOpen,
			addId,
			removeId,
			clearIds,
			toggleId,
			toggleStacked
		}),
		[
			selectedIds,
			selectedIdSet,
			selectedRecords,
			isStackedOpen,
			addId,
			removeId,
			clearIds,
			toggleId,
			toggleStacked
		]
	);
}

function ReportStackedContextProvider(
	props: ReportStackedContextProviderProps
) {
	const { children, configId, runId } = props;
	const value = useRunReportStackedState(runId, configId);

	return (
		<stackedContext.Provider value={value}>{children}</stackedContext.Provider>
	);
}

function useRunReportStacked() {
	return useRunReportStackedContext();
}

interface StackedAddProps {
	id: string;
}

function StackedAdd(props: StackedAddProps) {
	const { toggleId, selectedIdSet } = useRunReportStacked();

	return (
		<Tooltip content="Add for stacked mode">
			<ToolbarButton
				onClick={() => toggleId(props.id)}
				state={selectedIdSet.has(props.id) ? 'active' : 'default'}
			>
				<Icon name="AddSymbol" className="size-5" />
			</ToolbarButton>
		</Tooltip>
	);
}

export { useRunReportStacked, ReportStackedContextProvider, StackedAdd };
