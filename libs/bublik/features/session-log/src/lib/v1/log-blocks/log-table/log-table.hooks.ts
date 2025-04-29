/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useMemo, useState } from 'react';
import { ExpandedState, PaginationState, Table } from '@tanstack/react-table';

import { LogTableData } from '@/shared/types';
import { PaginationProps } from '@/shared/tailwind-ui';

import {
	FilterButton,
	FilterValue,
	LogTableFilterValue
} from './log-table.types';
import {
	LogTableContext,
	LogTablePaginationContext,
	useDelta
} from './log-table.context';
import {
	getFilters,
	getLevelOptions,
	getRowIdCreator,
	getScenarioOptions,
	getTestFilters
} from './log-table.utils';

export const flatten = <T extends { children?: T[] }>(arr: T[]): T[] => {
	return arr.reduce<T[]>(
		(acc, data) =>
			Array.isArray(data.children)
				? acc.concat(data, flatten(data.children))
				: acc.concat(data),
		[]
	);
};

/**
 * Creates initial map of all entities with its users to derive later filter buttons
 * @param data This is raw log table data
 * @returns Map of all entities with its users as well as main test entity
 */
export const getAllEntitiesMapWithUsers = (data: LogTableData[]) => {
	const allEntityMap = new Map<string, Set<string>>();
	let mainTestEntity: string | undefined;

	flatten(data).forEach(({ user_name, entity_name }) => {
		if (!allEntityMap.has(entity_name)) {
			allEntityMap.set(entity_name, new Set());
		}

		allEntityMap.get(entity_name)?.add(user_name);

		if (!mainTestEntity && user_name === 'TAPI Jumps') {
			mainTestEntity = entity_name;
		}
	});

	return { allEntityMap, mainTestEntity };
};

const getAllEntitiesAndUsers = (map: Map<string, Set<string>>) => {
	const entities = Array.from(map.keys());
	const users = Array.from(
		new Set(Array.from(map.values()).flatMap((set) => Array.from(set)))
	);

	return { entities, users };
};

export interface UseLogTableFilterConfig {
	data: LogTableData[];
}

export const useLogTableFilter = (config: UseLogTableFilterConfig) => {
	const { data } = config;

	const buttons = useMemo(() => {
		/**
		 * Creates an array of all filter buttons including #Scenario and #Test
		 * @param entityMap Map of all entities with its users
		 * @param mainTestEntity Main test entity being tested
		 * @returns Array of filter buttons
		 */
		const getFilterButtons = (
			entityMap: Map<string, Set<string>>,
			mainTestEntity?: string
		) => {
			const createEntityButtons = () => {
				return Array.from(entityMap.entries())
					.filter(([entityName]) => entityName !== mainTestEntity)
					.map(([entityName, users]) => ({
						entityName,
						users: Array.from(users)
					}))
					.flatMap(({ entityName, users }) =>
						users.map((user) => ({
							label: `${entityName}:${user}`,
							filters: [{ entityName: entityName, userName: user }]
						}))
					);
			};

			const createMainTestEntityButtons = () => {
				return mainTestEntity && entityMap.has(mainTestEntity)
					? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					  Array.from(entityMap.get(mainTestEntity)!).map((user) => ({
							label: `[#T]:${user}`,
							filters: [{ entityName: mainTestEntity, userName: user }]
					  }))
					: undefined;
			};

			const createScenarioTestButton = () => {
				const STATIC_USERS = ['Step', 'Artifact', 'Self'];

				if (!mainTestEntity) return;

				// eu_scenario_def.push({ entity: test_entity, user: 'Step' });
				// eu_scenario_def.push({ entity: test_entity, user: 'Artifact' });
				// eu_scenario_def.push({ entity: test_entity, user: 'Self' });
				// eu_scenario_def.push({ entity: 'Tester', user: 'Run' });

				const { entities, users } = getAllEntitiesAndUsers(entityMap);

				const testEntityFilters = STATIC_USERS.map((user) =>
					users.includes(user)
						? { entityName: mainTestEntity, userName: user }
						: undefined
				).filter((filter): filter is FilterValue => Boolean(filter));
				const testerRun =
					users.includes('Run') && entities.includes('Tester')
						? [{ entityName: 'Tester', userName: 'Run' }]
						: [];

				const scenarioTestButton: FilterButton = {
					label: '#SCENARIO',
					filters: [...testEntityFilters, ...testerRun]
				};

				return scenarioTestButton;
			};

			const createTestButton = (
				mainTestEntityFilterButtons: FilterButton[] | undefined
			) => {
				if (!mainTestEntityFilterButtons || !mainTestEntity) return;
				const mainEntityUsers = entityMap.get(mainTestEntity);
				if (!mainEntityUsers) return;
				const users = Array.from(mainEntityUsers);

				const filters = users.map((user) => ({
					userName: user,
					entityName: mainTestEntity
				}));

				return { label: '#TEST', filters };
			};

			const createAllTestsButton = (
				entitiesButton: FilterButton[],
				testEntityButton?: FilterButton[]
			) => {
				const testEntityFilters =
					testEntityButton?.flatMap((f) => f.filters) || [];

				return {
					label: `#ALL`,
					filters: [
						...entitiesButton.flatMap((f) => f.filters),
						...testEntityFilters
					]
				};
			};

			const entitiesFilterButtons = createEntityButtons();
			const mainTestEntityFilterButtons = createMainTestEntityButtons();
			const scenarioTestButton = createScenarioTestButton();
			const testButton = createTestButton(mainTestEntityFilterButtons);
			const allTestsButton = createAllTestsButton(
				entitiesFilterButtons,
				mainTestEntityFilterButtons
			);

			return {
				entitiesFilterButtons,
				mainTestEntityFilterButtons,
				scenarioTestButton,
				testButton,
				allTestsButton
			};
		};

		const { allEntityMap, mainTestEntity } = getAllEntitiesMapWithUsers(data);
		const {
			entitiesFilterButtons,
			mainTestEntityFilterButtons,
			scenarioTestButton,
			testButton,
			allTestsButton
		} = getFilterButtons(allEntityMap, mainTestEntity);

		// 1. Main buttons
		const filterButtons: FilterButton[] = [];
		filterButtons.push(...entitiesFilterButtons);
		if (mainTestEntityFilterButtons) {
			filterButtons.push(...mainTestEntityFilterButtons);
		}

		return {
			filterButtons,
			aggregateFilterButtons: {
				scenarioTestButton: scenarioTestButton,
				testButton,
				allTestsButton
			}
		};
	}, [data]);

	return { buttons };
};

export const useLogTableTimestamp = () => {
	const [isTimestampDeltaShown, setIsTimestampDeltaShown] = useState(false);

	const toggleIsTimestampDeltaShown = useCallback(
		() => setIsTimestampDeltaShown((prev) => !prev),
		[]
	);

	return useMemo(
		() => ({ isTimestampDeltaShown, toggleIsTimestampDeltaShown }),
		[isTimestampDeltaShown, toggleIsTimestampDeltaShown]
	);
};

interface UseLogTableColumnsConfig {
	table: Table<LogTableData>;
}

export const useLogTableDelta = ({ table }: UseLogTableColumnsConfig) => {
	const deltaApi = useDelta({ table });
	const timestampApi = useLogTableTimestamp();

	return { ...deltaApi, ...timestampApi };
};

function getDefaultFilterValue(options: LogTableFilterOptions) {
	const initialFilters: string[] = [...options.entitiesFilters];

	if (options.mainEntityFilters) {
		initialFilters.push(...options.mainEntityFilters);
	}

	return { levels: options.levels, filters: initialFilters };
}

function getFilterOptions(data: LogTableData[]): LogTableFilterOptions {
	const scenarioOptions = getScenarioOptions(data) ?? [];
	const { mainEntityFilters = [], entitiesFilters } = getFilters(data);
	const levels = getLevelOptions(data);
	const testOptions = getTestFilters(data) ?? [];
	const filters: string[] = [];
	if (mainEntityFilters) filters.push(...mainEntityFilters);
	filters.push(...entitiesFilters);

	return {
		scenarioOptions,
		mainEntityFilters,
		entitiesFilters,
		levels,
		filters,
		testOptions
	};
}

type LogTableFilterOptions = {
	scenarioOptions: string[];
	mainEntityFilters: string[];
	entitiesFilters: string[];
	levels: string[];
	filters: string[];
	testOptions: string[];
};

interface UseLogTableGlobalFilterConfig {
	data: LogTableData[];
	getDefaultFilter?: (
		filterOptions: LogTableFilterOptions
	) => LogTableFilterValue;
}

function useLogTableGlobalFilter(config: UseLogTableGlobalFilterConfig) {
	const { data, getDefaultFilter } = config;

	const filters = useMemo(() => getFilterOptions(data), [data]);

	const [globalFilter, setGlobalFilter] = useState<LogTableFilterValue>(
		getDefaultFilter?.(filters) ?? getDefaultFilterValue(filters)
	);

	return { filters, globalFilter, setGlobalFilter };
}

const getInitialExpandedState = (
	id: string,
	data: LogTableData[],
	levelToExpandTo = 1
): ExpandedState => {
	const rowIdCreator = getRowIdCreator(id);

	const getExpandedRowIds = (
		rows: LogTableData[],
		currentDepth = 0
	): LogTableData[] => {
		const filteredRows: LogTableData[] = [];

		for (const row of rows) {
			if (currentDepth <= levelToExpandTo - 1) filteredRows.push(row);

			if (Array.isArray(row.children)) {
				filteredRows.push(...getExpandedRowIds(row.children, currentDepth + 1));
			}
		}

		return filteredRows.filter((row) => Array.isArray(row.children));
	};

	const rowIdsToExpand = getExpandedRowIds(data).map((row) => [
		rowIdCreator(row),
		true
	]);

	return Object.fromEntries(rowIdsToExpand);
};

interface UseLogTableExpandedState {
	id: string;
	data: LogTableData[];
}

export const useLogTableExpandedState = ({
	id,
	data
}: UseLogTableExpandedState) => {
	const [expanded, setExpanded] = useState<ExpandedState>(
		getInitialExpandedState(id, data, 1)
	);

	return { expanded, setExpanded };
};

interface UseLogTablePaginationConfig {
	context: LogTablePaginationContext | null;
}

export const useLogTablePagination = ({
	context
}: UseLogTablePaginationConfig) => {
	let pagination: PaginationState;

	if (!context?.pagination?.state) {
		pagination = { pageIndex: 0, pageSize: 0 };
	} else {
		if (context.pagination.state.pageIndex === -1) {
			pagination = {
				pageIndex: 0,
				pageSize: context.pagination.state.pageSize
			};
		} else {
			pagination = context.pagination.state;
		}
	}

	const totalCount = context?.pagination?.totalCount;

	return { pagination, totalCount };
};

interface UseLogTablePaginationPropsConfig {
	id: string;
	table: Table<LogTableData>;
	context?: LogTableContext | null;
}

export const useLogTablePaginationProps = ({
	id,
	table,
	context
}: UseLogTablePaginationPropsConfig) => {
	const state = table.getState();
	const pageIndex = state.pagination.pageIndex;
	const pageSize = state.pagination.pageSize;

	const paginationProps: PaginationProps = {
		variant: 'log',
		totalCount: table.getPageCount(),
		currentPage: pageIndex + 1,
		pageSize,
		onPageChange: (page) => context?.onPageClick?.(id, page),
		onPageSizeChange: table.setPageSize,
		disablePageSizeSelect: true
	};

	return { paginationProps };
};

export { useLogTableGlobalFilter };
