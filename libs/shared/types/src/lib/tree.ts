/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
/**
|--------------------------------------------------
| DATA TYPES
|--------------------------------------------------
*/

/** Node entity, please be aware that suite is generated only on frontend */
export const enum NodeEntity {
	Package = 'pkg',
	Session = 'session',
	Test = 'test',
	Suite = 'suite'
}

/** Suite is used on frontend */
export type NodeEntityValue = 'pkg' | 'session' | 'test' | 'suite';

export interface NodeData {
	start?: string;
	id: string;
	name: string;
	entity: NodeEntity | NodeEntityValue;
	hasError: boolean;
	children: string[];
	errorCount?: number;
	skipped?: boolean;
	parentId: string | null;
	path?: string | null;
}

export type TreeData = Record<string, NodeData>;

/**
|--------------------------------------------------
| API RESPONSES
|--------------------------------------------------
*/

export interface TreeDataAPIResponse {
	mainPackage: string;
	tree: TreeData;
}
