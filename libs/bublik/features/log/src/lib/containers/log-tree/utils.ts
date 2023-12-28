/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { TreeDataAPIResponse, TreeData } from '@/shared/types';

export const getTreeOnlyWithErrors = (data: TreeDataAPIResponse) => {
	const newTree: TreeData = {};
	const hasErrors = Object.values(data.tree).some((node) => node.hasError);

	if (hasErrors) {
		Object.values(data.tree).forEach((node) => {
			if (node.hasError) {
				newTree[node.id] = { ...node };
				newTree[node.id].children = newTree[node.id].children.filter(
					(id) => data.tree[id].hasError
				);
			}
		});

		return newTree;
	}

	return null;
};
