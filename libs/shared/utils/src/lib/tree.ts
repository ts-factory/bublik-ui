/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { NodeData, NodeEntity, TreeData } from '@/shared/types';

export const traverseTree = <T extends { children: T[] }>(
	node: T,
	index: number,
	callback: (node: T, index: number, parent?: T) => void,
	parent?: T
) => {
	callback(node, index, parent);

	if (!node.children.length) return;

	node.children.forEach((childNode, index) =>
		traverseTree(childNode, index, callback, node)
	);
};

export const isPackage = (node: NodeData) => {
	return (
		node.entity === NodeEntity.Package ||
		node.entity === NodeEntity.Session ||
		node.entity === NodeEntity.Suite
	);
};

export const addParentIds = (data: { mainPackage: string; tree: TreeData }) => {
	// 1) Add parent id to root
	data.tree[data.mainPackage].parentId = null;

	// 2) Add parent id to all children of packages and sessions
	Object.values(data.tree).forEach((node) => {
		node.id = node.id.toString();

		if (!node.children) node.children = [];

		node.children = node.children?.map((id) => id.toString());

		node.children?.forEach((id) => (data.tree[id].parentId = node.id));
	});

	return data;
};

export const getAllDescendantIds = (
	tree: TreeData,
	nodeId: string
): string[] => {
	if (!tree[nodeId].children) tree[nodeId].children = [];

	return tree[nodeId].children.reduce(
		(acc: string[], childId: string) => [
			...acc,
			childId,
			...getAllDescendantIds(tree, childId)
		],
		[]
	);
};

export const getPathToNode = (
	nodeId: string,
	tree: TreeData,
	path: string[] = []
): string[] => {
	const currentParentId = tree[nodeId]?.parentId;

	if (!currentParentId) return path;

	return getPathToNode(currentParentId, tree, [...path, currentParentId]);
};

export const getErrorCount = (tree: TreeData, nodeId: string): number => {
	return getAllDescendantIds(tree, nodeId).reduce(
		(acc, id) => (tree[id].hasError ? acc + 1 : acc),
		0
	);
};

export const addErrorCount = (data: {
	mainPackage: string;
	tree: TreeData;
}) => {
	Object.values(data.tree)
		.filter((node: NodeData) => isPackage(node))
		.map(
			(node: NodeData) => (node.errorCount = getErrorCount(data.tree, node.id))
		);
};

export const addPathToNodes = (data: {
	mainPackage: string;
	tree: TreeData;
}) => {
	const PATH_SEPARATOR = '/';

	Object.values(data.tree).forEach((node) => {
		const idPath = getPathToNode(node.id, data.tree)
			.slice()
			.reverse()
			.concat(node.id)
			.filter((id) => data.tree[id].entity !== NodeEntity.Suite);

		node.path = idPath.map((id) => data.tree[id].name).join(PATH_SEPARATOR);
	});

	return data;
};
