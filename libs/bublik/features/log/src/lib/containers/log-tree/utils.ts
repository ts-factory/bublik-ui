/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { TreeDataAPIResponse, TreeData, NodeData } from '@/shared/types';

export const getTreeOnlyWithErrors = (data: TreeDataAPIResponse) => {
	const newTree: TreeData = {};
	const nodeIdsToKeep = new Set<string>();

	Object.values(data.tree).forEach((node) => {
		if (!node.has_error) return;

		let currentNodeId: string | null = node.id;

		while (currentNodeId) {
			const currentNode: NodeData | undefined = data.tree[currentNodeId];

			if (!currentNode || nodeIdsToKeep.has(currentNode.id)) {
				break;
			}

			nodeIdsToKeep.add(currentNode.id);
			currentNodeId = currentNode.parentId;
		}
	});

	if (!nodeIdsToKeep.size) return null;

	nodeIdsToKeep.forEach((nodeId) => {
		const node = data.tree[nodeId];

		if (!node) return;

		newTree[node.id] = {
			...node,
			children: node.children.filter((childId) => nodeIdsToKeep.has(childId))
		};
	});

	return newTree;
};
