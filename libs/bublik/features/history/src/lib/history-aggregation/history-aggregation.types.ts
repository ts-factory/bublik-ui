/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { HistorySliceState } from '../slice';

export type HistoryAggregationGlobalFilter = Pick<
	HistorySliceState['globalFilter'],
	'verdicts' | 'parameters' | 'resultType' | 'isNotExpected' | 'substringFilter'
>;

export type HistoryLinearArrayFilters = Exclude<
	keyof HistoryAggregationGlobalFilter,
	'resultType' | 'isNotExpected' | 'substringFilter'
>;
