/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { config } from '@/bublik/config';
import { isRevision, joinKeyValue, REVISION_POSTFIX } from '@/shared/utils';

const createRawString = (name?: string, value?: string) => {
	const key = name ?? '';
	const strValue = value ?? '';

	const rawString = joinKeyValue(name, value, config.keyValueDisplayDelimiter);
	const submitString = joinKeyValue(
		name,
		value,
		config.keyValueSubmitDelimiter
	);

	return [rawString, submitString, key, strValue] as const;
};

export const getDisplayText = (name?: string, value?: string) => {
	const [rawStr, submitString, key, rawValue] = createRawString(name, value);
	const isRevisionValue = isRevision(submitString);

	const displayValue = isRevisionValue
		? joinKeyValue(
				key.replace(REVISION_POSTFIX, ''),
				rawValue.slice(0, 8),
				config.keyValueDisplayDelimiter
		  )
		: rawStr;

	return {
		displayValue,
		copyValue: submitString
	};
};
