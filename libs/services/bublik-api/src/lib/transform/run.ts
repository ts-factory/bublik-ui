/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { RunAPIResponse } from '@/shared/types';

export const transformRunTable = (
	data: RunAPIResponse,
	_meta: unknown,
	_arg: unknown
) => {
	if (!data.results) return null;

	return [data.results];
};
