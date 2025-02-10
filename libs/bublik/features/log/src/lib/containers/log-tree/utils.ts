/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { TreeDataAPIResponse, TreeData } from '@/shared/types';

export const getTreeOnlyWithErrors = (data: TreeDataAPIResponse) => {
	const newTree: TreeData = {};
	const hasErrors = Object.values(data.tree).some((node) => node.has_error);

	if (hasErrors) {
		Object.values(data.tree).forEach((node) => {
			if (node.has_error) {
				newTree[node.id] = { ...node };
				newTree[node.id].children = newTree[node.id].children.filter(
					(id) => data.tree[id].has_error
				);
			}
		});

		return newTree;
	}

	return null;
};
