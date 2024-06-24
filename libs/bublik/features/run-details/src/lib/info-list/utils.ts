/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { isRevision, REVISION_POSTFIX } from '@/shared/utils';

const createRawString = (name?: string, value?: string) => {
	const key = name ?? '';
	const strValue = value ?? '';
	let rawString = '';

	if (key && strValue) rawString = `${key}: ${strValue}`;
	if (!key && strValue) rawString = strValue;
	if (key && !strValue) rawString = key;

	return [rawString, key, strValue] as const;
};

export const getDisplayText = (name?: string, value?: string) => {
	const [rawStr, key, rawValue] = createRawString(name, value);
	const isRevisionValue = isRevision(rawStr);

	const copyValue = rawStr.replace(': ', '=');
	const displayValue = isRevisionValue
		? `${key.replace(REVISION_POSTFIX, '')}: ${rawValue.slice(0, 8)}`
		: rawStr;

	return {
		displayValue,
		copyValue
	};
};
