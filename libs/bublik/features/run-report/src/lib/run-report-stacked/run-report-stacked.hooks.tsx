/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2025 OKTET LTD */
import { useMemo, createContext, useContext } from 'react';
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

interface RunReportStackedContext {
	runId: number;
	configId: number;
}

const stackedContext = createContext<RunReportStackedContext | null>(null);

export type RecordWithContext = RecordBlock & {
	chart?: ReportChart;
	argsVals: ArgsValBlock;
	measurement: MeasurementBlock;
};

type ReportStackedContextProviderProps = {
	runId: number;
	configId: number;
	children: React.ReactNode;
};

function ReportStackedContextProvider(
	props: ReportStackedContextProviderProps
) {
	const { children, configId, runId } = props;

	const value = useMemo<RunReportStackedContext>(() => {
		return {
			runId,
			configId
		};
	}, [runId, configId]);

	return (
		<stackedContext.Provider value={value}>{children}</stackedContext.Provider>
	);
}

function useRunReportStackedContext() {
	const context = useContext(stackedContext);

	if (!context) {
		throw new Error(
			'useRunReportStackedContext must be used within a StackedContextProvider'
		);
	}

	return context;
}

function useRunReportStacked() {
	const { runId, configId } = useRunReportStackedContext();
	const [_selectedIds = [], _setSelectedIds] = useQueryParam(
		SELECTED_RECORDS_FOR_STACKED_KEY,
		withDefault(ArrayParam, [])
	);
	const [isStackedOpen = false, setIsStackedOpen] = useQueryParam(
		STACKED_DRAWER_KEY,
		withDefault(BooleanParam, false)
	);
	const selectedIds = _selectedIds.filter((id): id is string => id !== null);
	const data = useGetRunReportQuery({ runId, configId });

	const records = useMemo<RecordWithContext[]>(() => {
		if (typeof data?.data === 'undefined') return [];

		return data.data.content
			.map((b) =>
				b.content.map((argsVals) =>
					argsVals.content.map((measurement) =>
						measurement.content.map((r) => ({
							...r,
							argsVals: argsVals,
							measurement: measurement
						}))
					)
				)
			)
			.flat(3)
			.filter((b) => typeof b.chart !== 'undefined');
	}, [data.data]);

	function toggleStacked(open?: boolean) {
		if (open === undefined) {
			setIsStackedOpen(!isStackedOpen);
		} else {
			setIsStackedOpen(open);
		}
	}

	function addId(id: string) {
		if (!selectedIds.includes(id)) {
			_setSelectedIds([...selectedIds, id]);
		}
	}

	function removeId(id: string) {
		if (selectedIds.includes(id)) {
			_setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
		}
	}

	function clearIds() {
		_setSelectedIds([]);
	}

	function toggleId(id: string) {
		if (selectedIds.includes(id)) {
			removeId(id);
		} else {
			addId(id);
		}
	}

	const selectedRecords =
		records?.filter((record) => selectedIds.includes(record.id)) ?? [];

	return {
		selectedIds,
		addId,
		removeId,
		clearIds,
		toggleId,
		selectedRecords,
		isStackedOpen,
		toggleStacked
	};
}

interface StackedAddProps {
	id: string;
}

function StackedAdd(props: StackedAddProps) {
	const { toggleId, selectedIds } = useRunReportStacked();

	return (
		<Tooltip content="Add for stacked mode">
			<ToolbarButton
				onClick={() => toggleId(props.id)}
				state={selectedIds.includes(props.id) ? 'active' : 'default'}
			>
				<Icon name="AddSymbol" className="size-5" />
			</ToolbarButton>
		</Tooltip>
	);
}

export { useRunReportStacked, ReportStackedContextProvider, StackedAdd };
