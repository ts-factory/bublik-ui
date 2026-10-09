/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { HistorySliceState } from '../slice';

export type HistoryLinearGlobalFilter = Pick<
	HistorySliceState['globalFilter'],
	'verdicts' | 'parameters' | 'tags' | 'resultType' | 'isNotExpected'
>;

export type ArrayKeys = Exclude<
	keyof HistoryLinearGlobalFilter,
	'resultType' | 'isNotExpected'
>;
