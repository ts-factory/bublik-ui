/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { TreeData, NodeData, NodeEntity } from '@/shared/types';
import { nanoid } from '@reduxjs/toolkit';

import { isPackage } from './tree';
import { getChunks } from './get-chunks';

const createSuiteFactory =
	(tree: TreeData) =>
	(name: string, parentId: string, children: string[]): NodeData => {
		const id = nanoid(4);
		const hasError = children.some((id) => tree[id].has_error);
		const entity = NodeEntity.Suite;

		return {
			id,
			name,
			has_error: hasError,
			parentId,
			children,
			entity
		};
	};

const createSuiteAdder = (tree: TreeData) => (suite: NodeData) => {
	if (!suite.parentId) return;

	tree[suite.id] = suite;
	suite.children.forEach((childId) => [(tree[childId].parentId = suite.id)]);
	tree[suite.parentId].children.push(suite.id);
};

const createNodeNameGetter = (tree: TreeData) => (nodeId: string) => {
	return tree[nodeId].name;
};

const isSameName = (nodeOne: NodeData, nodeTwo: NodeData) => {
	return nodeOne.name === nodeTwo.name;
};

const compareNodeNames =
	(tree: TreeData) => (lastId: string, currentId: string) => {
		const lastNode = tree[lastId];
		const currentNode = tree[currentId];

		if (!lastNode) return true;

		return isSameName(currentNode, lastNode);
	};

const getFolderIds = (tree: TreeData, threshold = 100): string[] => {
	return Object.values(tree)
		.filter(
			(node: NodeData) =>
				node.parentId !== null &&
				isPackage(node) &&
				node.children.length >= threshold
		)
		.map((node: NodeData) => node.id);
};

export const compressTests = (data: {
	main_package: string;
	tree: TreeData;
}) => {
	const getNodeName = createNodeNameGetter(data.tree);
	const buildSuite = createSuiteFactory(data.tree);
	const addSuiteToTree = createSuiteAdder(data.tree);

	getFolderIds(data.tree).forEach((folderId) => {
		const folderChildren = data.tree[folderId].children;

		const chunks = getChunks({
			data: folderChildren,
			equality: compareNodeNames(data.tree),
			skip: (nodeId) => isPackage(data.tree[nodeId])
		});

		data.tree[folderId].children = [];

		chunks.forEach((chunk) => {
			if (typeof chunk !== 'string') {
				const name = getNodeName(chunk[0]);
				const suite = buildSuite(name, folderId, chunk);

				return addSuiteToTree(suite);
			}

			return data.tree[folderId].children.push(chunk);
		});
	});

	return data;
};
