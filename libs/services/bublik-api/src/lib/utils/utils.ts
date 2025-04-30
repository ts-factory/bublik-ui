/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { decamelizeKeys, OptionOrProcessor } from 'humps';

export type MaybePromise<T> = T | PromiseLike<T>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prepareForSend = (queryParams: Record<string, any>) => {
	const decamelazationParams: OptionOrProcessor = { separator: '_' };

	return decamelizeKeys(queryParams, decamelazationParams);
};

export const getMinutes = (minutes: number) => minutes * 60;
