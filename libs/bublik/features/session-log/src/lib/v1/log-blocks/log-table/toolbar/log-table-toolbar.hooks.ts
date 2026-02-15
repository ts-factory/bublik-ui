/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ExpandedState, Row, Table } from '@tanstack/react-table';
import { useMeasure } from 'react-use';
import { UseMeasureRef } from 'react-use/lib/useMeasure';
import { CSSProperties, useMemo, useState } from 'react';

import { LogTableData } from '@/shared/types';
import { cn } from '@/shared/tailwind-ui';

import { LogTableFilterValue } from '../log-table.types';

export const ERROR_LEVEL_NAME = 'ERROR';

export function getExpandedStateForErrorRows(
	flatRows: Row<LogTableData>[],
	currentExpanded: ExpandedState
): ExpandedState {
	if (currentExpanded === true) return currentExpanded;

	const nextExpanded: Record<string, boolean> = {
		...(typeof currentExpanded === 'object' && currentExpanded
			? currentExpanded
			: {})
	};

	let isUpdated = false;

	flatRows.forEach((row) => {
		if (row.original.level !== ERROR_LEVEL_NAME) return;

		row.getParentRows().forEach((parentRow) => {
			if (nextExpanded[parentRow.id]) return;

			nextExpanded[parentRow.id] = true;
			isUpdated = true;
		});
	});

	return isUpdated ? nextExpanded : currentExpanded;
}

export function expandRowsToErrorDepth(table: Table<LogTableData>) {
	const expandedState = getExpandedStateForErrorRows(
		table.getCoreRowModel().flatRows,
		table.getState().expanded
	);

	if (expandedState !== table.getState().expanded) {
		table.setExpanded(expandedState);
	}
}

export function useTableDepth(table: Table<LogTableData>) {
	const maximumDepth = useMemo(
		() =>
			table
				.getCoreRowModel()
				.flatRows.reduce((acc, row) => Math.max(acc, row.depth), 0),
		[table]
	);

	const handleDepthClick = (depth: number) => {
		table.getCoreRowModel().flatRows.forEach((row) => {
			if (row.depth >= depth) {
				row.toggleExpanded(false);
			} else {
				row.toggleExpanded(true);
			}
		});
	};

	return { maximumDepth, handleDepthClick };
}

export function useFilterOptions(
	levels: string[],
	entityFilters: string[],
	mainEntityFilters?: string[]
) {
	return useMemo(() => {
		const sortLevels = (left: string, right: string) => {
			const levelMap = new Map<string, number>([
				['INFO', 1],
				['RING', 2],
				['WARN', 3],
				['ERROR', 4]
			]);

			const leftWeight = levelMap.get(left) ?? 0;
			const rightWeight = levelMap.get(right) ?? 0;
			const isLargerWeight = leftWeight > rightWeight;

			if (leftWeight === rightWeight) return 0;

			return isLargerWeight ? 1 : -1;
		};

		const formatLevel = (value: string) => {
			const label = value.split(':').join(': ');
			return { label, value };
		};

		const levelOptions = levels.slice().sort(sortLevels).map(formatLevel);

		const mainOptions =
			mainEntityFilters?.map((v) => ({
				label: `#T: ${v.split(':')[1]}`,
				value: v
			})) ?? [];

		const entityOptions = entityFilters.map((v) => ({ label: v, value: v }));

		return {
			filters: [...mainOptions, ...entityOptions],
			levels: levelOptions
		};
	}, [entityFilters, levels, mainEntityFilters]);
}

interface ToolbarPosition {
	ref: UseMeasureRef<HTMLDivElement>;
	style: CSSProperties;
	isOpen: boolean;
	setIsOpen: (value: boolean) => void;
	containerClassName: string;
}

export function useToolbarPosition(isIntersection?: boolean): ToolbarPosition {
	const [isOpen, setIsOpen] = useState(false);
	const [ref, { height }] = useMeasure<HTMLDivElement>();

	const baseStyle = {
		position: 'sticky',
		zIndex: 10,
		width: '100%'
	} satisfies CSSProperties;

	const style = isIntersection
		? {
				...baseStyle,
				width: 'fit-content',
				top: isOpen ? 0 : -height,
				padding: isOpen ? '8px' : '0px'
		  }
		: baseStyle;

	const containerClassName = cn(
		'flex justify-between gap-12 mb-2',
		'bg-white rounded-b-lg',
		'transition-all',
		isIntersection && isOpen && 'shadow-xl'
	);

	return {
		ref,
		style,
		isOpen,
		setIsOpen,
		containerClassName
	};
}

export function useFilterHandlers(
	table: Table<LogTableData>,
	filters: string[],
	levels: string[]
) {
	const handleFilterClick = (values: string[] | undefined) => {
		table.setGlobalFilter((old: LogTableFilterValue) => {
			if (!values) return;

			const isAllPresent = values?.every((filter) =>
				old.filters.includes(filter)
			);

			const nextFilters = isAllPresent
				? old.filters.filter((fil) => !values?.includes(fil))
				: Array.from(new Set([...old.filters, ...values].filter(Boolean)));

			return { ...old, filters: nextFilters };
		});
	};

	const handleRefreshClick = () => {
		table.setGlobalFilter({ filters, levels });
		table.toggleAllRowsExpanded(true);
	};

	return { handleFilterClick, handleRefreshClick };
}
