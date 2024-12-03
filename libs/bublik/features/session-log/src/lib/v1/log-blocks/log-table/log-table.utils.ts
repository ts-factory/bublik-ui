/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FilterFn, Row } from '@tanstack/react-table';

import { LogTableBlock, LogTableData } from '@/shared/types';
import { flatten, getAllEntitiesMapWithUsers } from './log-table.hooks';
import { LogTableFilterValue } from './log-table.types';

export const getRowColor = (row: LogTableBlock['data'][number]) => {
	const BLUE_HIGHLIGHT = ['TAPI Jumps'];
	const GREEN_HIGHLIGHT = ['StepPush', 'StepPop', 'Artifact', 'Verdict'];
	const PRIORITY_LEVELS_HIGHLIGHT = ['ERROR', 'WARN'];

	const getColorByLevel = (level: LogTableData['level']) => {
		switch (level) {
			case 'ERROR':
				return 'bg-log-row-error/50 hover:bg-log-row-error/70';
			case 'WARN':
				return 'bg-log-row-warn/50 hover:bg-log-row-warn/70';
			case 'INFO':
				return 'bg-log-row-info/70 hover:bg-log-row-info';
			case 'VERB':
				return 'bg-log-row-verb/50 hover:bg-log-row-verb/70';
			case 'PACKET':
				return 'bg-log-row-packet/70 hover:bg-log-row-packet';
			default:
				return 'hover:bg-gray-50';
		}
	};

	const isErrorLevel = (level: string) =>
		PRIORITY_LEVELS_HIGHLIGHT.includes(level);

	if (PRIORITY_LEVELS_HIGHLIGHT.includes(row.level)) {
		return getColorByLevel(row.level);
	}

	if (BLUE_HIGHLIGHT.includes(row.user_name) && !isErrorLevel(row.level)) {
		return 'bg-blue-300/50 hover:bg-blue-300/70';
	}

	if (
		GREEN_HIGHLIGHT.includes(row.user_name) &&
		row.level !== 'MI' &&
		!isErrorLevel(row.level)
	) {
		return 'bg-[#65cd84]/50 hover:bg-[#65cd84]/70';
	}

	return getColorByLevel(row.level);
};

export const logFilterFn: FilterFn<LogTableData> = (
	row,
	_columnId,
	filterValue: LogTableFilterValue,
	_addMeta
) => {
	const { entity_name: entityName, user_name: userName, level } = row.original;

	return (
		filterValue.filters.includes(`${entityName}:${userName}`) &&
		filterValue.levels.includes(level)
	);
};

export const getLevelOptions = (data: LogTableData[]) => {
	return Array.from(new Set(flatten(data).map((d) => d.level)));
};

export const getScenarioOptions = (data: LogTableData[]) => {
	const getAllEntitiesAndUsers = (map: Map<string, Set<string>>) => {
		const entities = Array.from(map.keys());
		const users = Array.from(
			new Set(Array.from(map.values()).flatMap((set) => Array.from(set)))
		);

		return { entities, users };
	};

	const STATIC_USERS = ['Step', 'Artifact', 'Self'];
	const { allEntityMap, mainTestEntity } = getAllEntitiesMapWithUsers(
		flatten(data)
	);

	if (!mainTestEntity) return;

	// eu_scenario_def.push({ entity: test_entity, user: 'Step' });
	// eu_scenario_def.push({ entity: test_entity, user: 'Artifact' });
	// eu_scenario_def.push({ entity: test_entity, user: 'Self' });
	// eu_scenario_def.push({ entity: 'Tester', user: 'Run' });

	const { entities, users } = getAllEntitiesAndUsers(allEntityMap);

	const testEntityFilters = STATIC_USERS.map((user) =>
		users.includes(user)
			? { entityName: mainTestEntity, userName: user }
			: undefined
	)
		.filter((filter): filter is { entityName: string; userName: string } =>
			Boolean(filter)
		)
		.map((d) => `${d.entityName}:${d.userName}`);
	const testerRun =
		users.includes('Run') && entities.includes('Tester')
			? `Tester:Run`
			: undefined;

	return [...testEntityFilters, testerRun].filter((s): s is string =>
		Boolean(s)
	);
};

export const getFilters = (data: LogTableData[]) => {
	const { allEntityMap, mainTestEntity } = getAllEntitiesMapWithUsers(
		flatten(data)
	);

	const entitiesFilters = Array.from(allEntityMap.entries())
		.filter(([entityName]) => entityName !== mainTestEntity)
		.map(([entityName, users]) => ({
			entityName,
			users: Array.from(users)
		}))
		.flatMap(({ entityName, users }) =>
			users.map((user) => ({
				label: `${entityName}:${user}`,
				filters: { entityName: entityName, userName: user }
			}))
		)
		.map((d) => `${d.filters.entityName}:${d.filters.userName}`);

	const mainEntityFilters =
		mainTestEntity && allEntityMap.has(mainTestEntity)
			? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				Array.from(allEntityMap.get(mainTestEntity)!)
					.map((user) => ({
						label: `[#T]:${user}`,
						filters: { entityName: mainTestEntity, userName: user }
					}))
					.map((d) => `${d.filters.entityName}:${d.filters.userName}`)
			: undefined;

	return { entitiesFilters, mainEntityFilters };
};

export const getTestFilters = (data: LogTableData[]) => {
	const { allEntityMap, mainTestEntity } = getAllEntitiesMapWithUsers(
		flatten(data)
	);

	if (!mainTestEntity) return;

	const mainEntityUsers = allEntityMap.get(mainTestEntity);

	if (!mainEntityUsers) return;

	const users = Array.from(mainEntityUsers);

	return users.map((user) => `${mainTestEntity}:${user}`);
};

/**
 *  Creates row id which consists of block id (array index) and line number
 */
export const getRowIdCreator =
	(tableId = '0') =>
	(rawRow: LogTableData): string => {
		return `${tableId}_${rawRow.line_number.toString()}`;
	};

/**
 * Returns row id pars which consists of block id (array index) and line number
 */
export const getRowIdParts = (row: Row<LogTableData>) => {
	return {
		rowTableId: Number(row.id.split('_')[0]),
		rowNumber: Number(row.id.split('_')[1])
	};
};
