/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2025 OKTET LTD */
import { BooleanParam, useQueryParam, withDefault } from 'use-query-params';

import {
	DEFAULT_ENABLE_PAIR_GAIN_COLUMNS,
	ENABLE_PAIR_GAIN_COLUMNS_KEY
} from '../run-report.constants';

function useEnablePairGainColumns() {
	const [enablePairGainColumns, setEnablePairGainColumns] = useQueryParam(
		ENABLE_PAIR_GAIN_COLUMNS_KEY,
		withDefault(BooleanParam, DEFAULT_ENABLE_PAIR_GAIN_COLUMNS)
	);

	function toggleEnablePairGainColumns(enable?: boolean) {
		setEnablePairGainColumns(enable ?? !enablePairGainColumns);
	}

	return [enablePairGainColumns, toggleEnablePairGainColumns] as const;
}

export { useEnablePairGainColumns };
