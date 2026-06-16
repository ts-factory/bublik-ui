/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { RunAPIResponse, RunTableAPIResponse } from '@/shared/types';

export const transformRunTable = (
	data: RunAPIResponse,
	_meta: unknown,
	_arg: unknown
): RunTableAPIResponse => {
	return {
		results: data.results ? [data.results] : null,
		defaultColumns: data.default_columns
	};
};
