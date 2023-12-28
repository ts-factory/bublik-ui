/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Table } from '@tanstack/react-table';
import { useMemo, useState } from 'react';

import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
	Icon,
	Tooltip,
	cn,
	DropdownMenuLabel,
	Separator,
	ButtonTw
} from '@/shared/tailwind-ui';

import { upperCaseFirstLetter } from '@/shared/utils';
import { LogTableData } from '@/shared/types';
import { LogTableFilterValue } from '../log-table.types';
import { TableDepthFilter } from './table-depth-filter';
import { DataTableFacetedFilter } from './table-filter';
import { useSettingsContext } from '../settings.context';

const ERROR_LEVEL = 'ERROR';

export interface ColumnToggleProps {
	table: Table<LogTableData>;
}

export const ColumnToggle = ({ table }: ColumnToggleProps) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<DropdownMenu open={isOpen}>
			<DropdownMenuTrigger asChild onClick={() => setIsOpen(true)}>
				<ButtonTw
					size="xs/2"
					state={isOpen && 'active'}
					variant="outline-secondary"
					className="w-full"
				>
					Columns
					<Icon name="ArrowShortSmall" />
				</ButtonTw>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				className="w-56 rounded-lg"
				onEscapeKeyDown={() => setIsOpen(false)}
				onInteractOutside={() => setIsOpen(false)}
				loop
			>
				<DropdownMenuLabel className="py-2 text-xs">
					Column Visibility
				</DropdownMenuLabel>
				<Separator className="h-px my-1 -mx-1" />
				{table.getAllLeafColumns().map((column) => (
					<DropdownMenuCheckboxItem
						key={column.id}
						checked={column.getIsVisible()}
						onCheckedChange={column.toggleVisibility}
						className="text-xs"
					>
						{column.id
							.split('_')
							.map((id) => upperCaseFirstLetter(id.toLowerCase()))
							.join(' ')}
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export interface LogTableToolbarProps {
	table: Table<LogTableData>;
	levels: string[];
	scenario?: string[];
	test?: string[];
	mainEntityFilters?: string[];
	entityFilters: string[];
	isDeltaShown?: boolean;
	handleDeltaChangeClick: () => void;
}

export const LogTableToolbar = (props: LogTableToolbarProps) => {
	const {
		table,
		levels,
		scenario,
		test,
		mainEntityFilters,
		entityFilters,
		handleDeltaChangeClick,
		isDeltaShown
	} = props;

	const settingsApi = useSettingsContext();

	const maximumDepth = useMemo(
		() =>
			table
				.getCoreRowModel()
				.flatRows.reduce((acc, row) => Math.max(acc, row.depth), 0),
		[table]
	);

	const filters = useMemo(
		() => [...entityFilters, ...(mainEntityFilters ?? [])].filter(Boolean),
		[entityFilters, mainEntityFilters]
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

	const options = useMemo(() => {
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

	const handleRefreshClick = () => {
		table.setGlobalFilter({ filters, levels });
		table.toggleAllRowsExpanded(true);
	};

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

	const state = table.getState().globalFilter as LogTableFilterValue;

	const isScenarioButtonActive = scenario?.every((scenarioOptions) =>
		state.filters?.includes(scenarioOptions)
	);
	const isTestButtonActive = test?.every((testOptions) =>
		state.filters?.includes(testOptions)
	);

	const isAllButtonActive = filters.every((allOptions) =>
		state.filters?.includes(allOptions)
	);
	const isErrorActive = state.levels.includes(ERROR_LEVEL);

	return (
		<div className="grid mb-4 grid-cols-[max-content_max-content_max-content_1fr_max-content_max-content] gap-2">
			<div className="flex items-center col-start-2 row-start-1 gap-2">
				{scenario && (
					<Tooltip content="Toggle scenario filters">
						<ButtonTw
							variant="outline"
							size="xs/2"
							state={isScenarioButtonActive && 'active'}
							onClick={() => handleFilterClick(scenario)}
						>
							#Scenario
						</ButtonTw>
					</Tooltip>
				)}
				{test && (
					<Tooltip content="Toggle test filters">
						<ButtonTw
							variant="outline"
							size="xs/2"
							state={isTestButtonActive && 'active'}
							onClick={() => handleFilterClick(test)}
						>
							#Test
						</ButtonTw>
					</Tooltip>
				)}
				<Tooltip content="Toggle all filters">
					<ButtonTw
						variant="outline"
						size="xs/2"
						state={isAllButtonActive && 'active'}
						onClick={() => handleFilterClick(filters)}
					>
						#All
					</ButtonTw>
				</Tooltip>
			</div>
			<div className="col-start-3 row-start-1">
				{levels.includes(ERROR_LEVEL) ? (
					<Tooltip content="Show/hide errors">
						<ButtonTw
							size="xs/2"
							variant="outline"
							disabled={!levels.includes(ERROR_LEVEL)}
							onClick={() =>
								table.setGlobalFilter((prev: LogTableFilterValue) => ({
									...prev,
									levels: prev.levels.includes(ERROR_LEVEL)
										? prev.levels.filter((level) => level !== ERROR_LEVEL)
										: prev.levels.concat(ERROR_LEVEL)
								}))
							}
							className={cn(
								'w-full',
								isErrorActive &&
									'bg-bg-error text-white hover:bg-bg-error hover:text-white border-bg-error'
							)}
						>
							<Icon
								name="InformationCircleExclamationMark"
								size={16}
								className="mr-2"
							/>
							{ERROR_LEVEL}
						</ButtonTw>
					</Tooltip>
				) : null}
			</div>

			<div className="col-start-1 row-start-1">
				<TableDepthFilter
					maxDepth={maximumDepth}
					onDepthClick={handleDepthClick}
					flatRows={table.getCoreRowModel().flatRows}
				/>
			</div>
			<div className="col-start-1 row-start-2">
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
			</div>

			<div className="col-start-2 row-start-2">
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
			</div>
			<div className="col-start-6 row-start-2">
				<Tooltip content="Toggle line wrapping">
					<ButtonTw
						variant="outline"
						size="xs/2"
						state={settingsApi.isWordBreakEnabled && 'active'}
						onClick={() => settingsApi.toggleWordBreak?.()}
					>
						<Icon name="TextWrap" size={16} className="mr-2" />
						Line Wrap
					</ButtonTw>
				</Tooltip>
			</div>
			<div className="col-start-3 row-start-2">
				<ButtonTw
					variant="outline"
					size="xs/2"
					onClick={handleRefreshClick}
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
			</div>
			<div className="col-start-5 row-start-2">
				<Tooltip content="Show/hide timestamp delta">
					<ButtonTw
						variant="outline"
						size="xs/2"
						onClick={handleDeltaChangeClick}
						className="w-full"
						state={isDeltaShown && 'active'}
					>
						<Icon name="TriangleDelta" size={16} className="mr-2" />
						Time Delta
					</ButtonTw>
				</Tooltip>
			</div>
			<div className="col-start-6 row-start-1">
				<ColumnToggle table={table} />
			</div>
		</div>
	);
};
