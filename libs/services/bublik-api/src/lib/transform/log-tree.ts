/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FetchBaseQueryMeta } from '@reduxjs/toolkit/dist/query';
import { camelizeKeys } from 'humps';

import { TreeDataAPIResponse } from '@/shared/types';
import { addParentIds, addPathToNodes, compressTests } from '@/shared/utils';

export type TreeDataTransformFn = (
	baseQueryReturnValue: TreeDataAPIResponse,
	meta: FetchBaseQueryMeta | undefined
) => TreeDataAPIResponse | Promise<TreeDataAPIResponse | null> | null;

export const transformLogTree: TreeDataTransformFn = (response, _meta) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const camelizedResponse = camelizeKeys(response) as any;

	if (!camelizedResponse.mainPackage) return null;

	return addPathToNodes(compressTests(addParentIds(camelizedResponse)));
};
