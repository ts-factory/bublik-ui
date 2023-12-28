/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';

import { useHistoryQuery } from '../hooks';
import { getLegendItems } from './history-filter-legend.container.utils';
import { HistoryFilterLegend } from './history-filter-legend.component';

export const HistoryFilterLegendContainer = () => {
	const { query } = useHistoryQuery();

	const legendItems = useMemo(() => getLegendItems(query), [query]);

	return <HistoryFilterLegend items={legendItems} />;
};
