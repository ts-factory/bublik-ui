/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentPropsWithoutRef, useMemo, useState } from 'react';
import { Table } from '@tanstack/react-table';
import * as ToggleGroup from '@radix-ui/react-toggle-group';

import { LogTableData } from '@/shared/types';
import { Icon, Tooltip, cn, ButtonTw, Separator } from '@/shared/tailwind-ui';

import { LogTableFilterValue } from '../log-table.types';
import { TableDepthFilter } from './table-depth-filter';
import { DataTableFacetedFilter } from './table-filter';
import { useSettingsContext } from '../settings.context';
import {
	useFilterOptions,
	useToolbarPosition,
	useTableDepth,
	useFilterHandlers,
	ERROR_LEVEL_NAME
} from './log-table-toolbar.hooks';
import { ColumnToggle } from './column-toggle';
import { FloatingExpandButton } from './expand-button';

export interface LogTableToolbarProps {
	table: Table<LogTableData>;
	levels: string[];
	scenario?: string[];
	test?: string[];
	mainEntityFilters?: string[];
	entityFilters: string[];
	isDeltaShown?: boolean;
	handleDeltaChangeClick: () => void;
	isIntersection?: boolean;
}

export function LogTableToolbar(props: LogTableToolbarProps) {
	const {
		table,
		levels,
		scenario,
		test,
		mainEntityFilters,
		entityFilters,
		handleDeltaChangeClick,
		isDeltaShown,
		isIntersection = false
	} = props;

	const settingsApi = useSettingsContext();
	const { maximumDepth, handleDepthClick } = useTableDepth(table);
	const options = useFilterOptions(levels, entityFilters, mainEntityFilters);
	const { ref, style, isOpen, setIsOpen, containerClassName } =
		useToolbarPosition(isIntersection);

	const filters = useMemo(
		() => [...entityFilters, ...(mainEntityFilters ?? [])].filter(Boolean),
		[entityFilters, mainEntityFilters]
	);

	const { handleFilterClick, handleRefreshClick } = useFilterHandlers(
		table,
		filters,
		levels
	);

	return (
		<div className={containerClassName} style={style} ref={ref}>
			<FloatingExpandButton
				isOpen={isOpen}
				onClick={() => setIsOpen(!isOpen)}
				isIntersection={isIntersection}
			/>
			<ToolbarContent
				table={table}
				maximumDepth={maximumDepth}
				handleDepthClick={handleDepthClick}
				scenario={scenario}
				test={test}
				filters={filters}
				levels={levels}
				options={options}
				handleFilterClick={handleFilterClick}
				handleRefreshClick={handleRefreshClick}
			/>

			<div className="grid items-center grid-cols-[max-content_max-content] gap-2">
				<Tooltip content="Show/hide timestamp delta">
					<ButtonTw
						variant="outline"
						size="xs/2"
						onClick={handleDeltaChangeClick}
						className="w-full row-start-2"
						state={isDeltaShown && 'active'}
					>
						<Icon name="TriangleDelta" size={16} className="mr-2" />
						Time Delta
					</ButtonTw>
				</Tooltip>

				<Tooltip content="Toggle line wrapping">
					<ButtonTw
						variant="outline"
						size="xs/2"
						state={settingsApi.isWordBreakEnabled && 'active'}
						onClick={() => settingsApi.toggleWordBreak?.()}
						className="row-start-2"
					>
						<Icon name="TextWrap" size={16} className="mr-2" />
						Line Wrap
					</ButtonTw>
				</Tooltip>

				<ColumnToggle table={table} className="row-start-1 col-start-2" />
			</div>
		</div>
	);
}

type FilterType = 'scenario' | 'test' | 'all' | 'error';

interface ToggleGroupFilterProps {
	table: Table<LogTableData>;
	scenario?: string[];
	test?: string[];
	levels: string[];
	filters: string[];
}

function ToggleGroupFilter(props: ToggleGroupFilterProps) {
	const { table, scenario = [], test = [], filters = [] } = props;
	const [activeFilter, setActiveFilter] = useState<FilterType | undefined>();
	const handleToggle = (type: FilterType) => {
		const typeToFilter: Record<string, string[]> = {
			scenario: scenario ?? [],
			test: test ?? [],
			all: filters ?? []
		};

		if (type === 'error') {
			table.setGlobalFilter((prev: LogTableFilterValue) => ({
				...prev,
				levels: [ERROR_LEVEL_NAME]
			}));

			setActiveFilter((prev) => (prev === 'error' ? undefined : 'error'));
			return;
		}

		table.setGlobalFilter((prev: LogTableFilterValue) => ({
			...prev,
			filters: typeToFilter[type]
		}));

		setActiveFilter((prev) => (prev === type ? undefined : type));
	};

	const state = table.getState().globalFilter as LogTableFilterValue;

	const scenarioActive =
		scenario?.length > 0 &&
		scenario?.every((filter) => state.filters.includes(filter)) &&
		state.filters.length === scenario.length;

	const testActive =
		test?.length > 0 &&
		test?.every((filter) => state.filters.includes(filter)) &&
		state.filters.length === test.length;

	const allActive =
		filters.length > 0 &&
		filters.every((filter) => state.filters.includes(filter));

	return (
		<ToggleGroup.Root
			type="single"
			value={activeFilter}
			onValueChange={(v) => {
				if (!v) return;
				handleToggle(v as FilterType);
			}}
			className={cn(
				'flex items-center rounded-md border border-border-primary',
				'[&>:first-child]:rounded-l-md [&>:last-child]:rounded-r-md'
			)}
		>
			<ToggleGroupFilterItem
				value="scenario"
				tooltip="Toggle scenario filters"
				disabled={!scenario?.length}
				data-state={scenarioActive ? 'on' : 'off'}
			>
				#Scenario
			</ToggleGroupFilterItem>
			<Separator
				orientation="vertical"
				className="shrink-0 bg-border-primary w-px h-[30px]"
			/>
			<ToggleGroupFilterItem
				value="test"
				tooltip="Toggle test filters"
				disabled={!test?.length}
				data-state={testActive ? 'on' : 'off'}
			>
				#Test
			</ToggleGroupFilterItem>
			<Separator
				orientation="vertical"
				className="shrink-0 bg-border-primary w-px h-[30px]"
			/>
			<ToggleGroupFilterItem
				value="all"
				tooltip="Toggle all filters"
				disabled={!filters?.length}
				data-state={allActive ? 'on' : 'off'}
			>
				#All
			</ToggleGroupFilterItem>
		</ToggleGroup.Root>
	);
}

type ToggleGroupFilterItemProps = ComponentPropsWithoutRef<
	typeof ToggleGroup.Item
> & {
	tooltip?: string;
};

function ToggleGroupFilterItem(props: ToggleGroupFilterItemProps) {
	const { value, tooltip, children, className, ...rest } = props;

	return (
		<Tooltip content={tooltip ?? ''} disabled={!tooltip}>
			<ToggleGroup.Item value={value} asChild {...rest}>
				<button
					className={cn(
						'inline-flex items-center justify-center flex-1',
						'px-2.5 py-[7px]',
						'hover:bg-gray-50',
						'text-xs font-medium text-text-primary',
						'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
						'disabled:bg-white disabled:hover:bg-white disabled:text-text-menu',
						'transition-all appearance-none select-none',
						'[&[data-state=on]]:bg-primary [&[data-state=on]]:text-white',
						className
					)}
				>
					{children}
				</button>
			</ToggleGroup.Item>
		</Tooltip>
	);
}

type FacetedFilterOption = {
	label: string;
	value: string;
};

type FacetedFilterOptions = {
	levels: FacetedFilterOption[];
	filters: FacetedFilterOption[];
};

interface FacetedFiltersProps {
	table: Table<LogTableData>;
	options: FacetedFilterOptions;
}

function FacetedFilters({ table, options }: FacetedFiltersProps) {
	return (
		<>
			<DataTableFacetedFilter
				title="Log Level"
				options={options.levels}
				onChange={(values) =>
					table.setGlobalFilter((val: LogTableFilterValue) => ({
						...val,
						levels: values
					}))
				}
				value={table.getState().globalFilter.levels}
				className="w-full"
			/>

			<DataTableFacetedFilter
				title="Entity / User"
				options={options.filters}
				onChange={(values) =>
					table.setGlobalFilter((val: LogTableFilterValue) => ({
						...val,
						filters: values
					}))
				}
				value={table.getState().globalFilter.filters}
				className="w-full"
			/>
		</>
	);
}

interface ResetButtonProps {
	onClick: () => void;
}

interface ToolbarContentProps {
	table: Table<LogTableData>;
	maximumDepth: number;
	handleDepthClick: (depth: number) => void;
	scenario?: string[];
	test?: string[];
	filters: string[];
	levels: string[];
	options: ReturnType<typeof useFilterOptions>;
	handleFilterClick: (values: string[] | undefined) => void;
	handleRefreshClick: () => void;
}

function ToolbarContent(props: ToolbarContentProps) {
	const {
		table,
		maximumDepth,
		handleDepthClick,
		handleRefreshClick,
		options,
		scenario,
		test,
		levels,
		filters
	} = props;

	return (
		<div className="grid items-center grid-cols-[max-content_max-content_max-content] gap-2">
			<TableDepthFilter
				maxDepth={maximumDepth}
				onDepthClick={handleDepthClick}
				flatRows={table.getCoreRowModel().flatRows}
				className="w-full"
			/>
			<ToggleGroupFilter
				table={table}
				scenario={scenario}
				test={test}
				levels={levels}
				filters={filters}
			/>
			<div />
			<FacetedFilters table={table} options={options} />
			<ResetButton onClick={handleRefreshClick} />
		</div>
	);
}

function ResetButton({ onClick }: ResetButtonProps) {
	return (
		<ButtonTw
			variant="outline"
			size="xs/2"
			onClick={onClick}
			className="w-full"
		>
			<Icon
				name="Refresh"
				size={16}
				style={{ transform: 'scaleX(-1)' }}
				className="mr-2"
			/>
			Reset
		</ButtonTw>
	);
}
