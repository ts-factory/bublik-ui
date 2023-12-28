/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ResultTableFilter } from '@/shared/types';

export const createRequestAdder =
	(columnId: string, request: ResultTableFilter) =>
	(currentRequests: Record<string, ResultTableFilter> = {}) => {
		return { ...currentRequests, [columnId]: request };
	};

export const createRequestRemover =
	(columnId: string) =>
	(currentRequests: Record<string, ResultTableFilter> = {}) => {
		const request = { ...currentRequests };

		delete request[columnId];

		return request;
	};
