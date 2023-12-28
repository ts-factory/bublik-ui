/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect } from 'react';

import { formatTimeToDot } from '@/shared/utils';

export type useMeasurementTitleConfig = {
	name?: string;
	start?: string;
	runId?: string;
};

export const useMeasurementTitle = ({
	name,
	start,
	runId
}: useMeasurementTitleConfig) => {
	useEffect(() => {
		if (!name || !start || !runId) {
			document.title = 'Measurements - Bublik';
			return;
		}

		const formattedTime = formatTimeToDot(start);

		document.title = `${name} | ${formattedTime} | ${runId} | Measurements - Bublik`;
	}, [name, runId, start]);
};
