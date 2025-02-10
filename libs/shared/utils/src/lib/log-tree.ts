/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { TreeDataAPIResponse } from '@/shared/types';

import { addParentIds, addPathToNodes } from './tree';
import { compressTests } from './compress-tests';

export type TreeDataTransformFn = (
	baseQueryReturnValue: TreeDataAPIResponse
) => TreeDataAPIResponse | Promise<TreeDataAPIResponse | null> | null;

export const transformLogTree: TreeDataTransformFn = (response) => {
	if (!response.main_package) return null;

	return addPathToNodes(compressTests(addParentIds(response)));
};
