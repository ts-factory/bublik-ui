/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { config } from '@/bublik/config';
import { normalizeKeyValueForSubmit } from '@/shared/utils';

/** Normalize a single runData/tag value into its submit form (e.g. `key: v` -> `key=v`). */
export const normalizeRunDataValue = (value: string) => {
	return normalizeKeyValueForSubmit(value, {
		displayDelimiter: config.keyValueDisplayDelimiter,
		submitDelimiter: config.keyValueSubmitDelimiter
	});
};

/** Normalize and deduplicate a list of runData/tag values. */
export const normalizeRunDataList = (values: string[]) => {
	return Array.from(new Set(values.map(normalizeRunDataValue).filter(Boolean)));
};

/** Normalize a delimited runData query string, preserving the query delimiter. */
export const normalizeRunDataQuery = (queryValue: string) => {
	return queryValue
		.split(config.queryDelimiter)
		.filter(Boolean)
		.map(normalizeRunDataValue)
		.filter(Boolean)
		.join(config.queryDelimiter);
};
