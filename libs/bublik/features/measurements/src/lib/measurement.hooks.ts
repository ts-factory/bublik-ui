/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { formatTimeToDot } from '@/shared/utils';
import { useTabTitleWithPrefix } from '@/bublik/features/projects';

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
	const formattedTime = start ? formatTimeToDot(start) : '';

	useTabTitleWithPrefix([name, formattedTime, runId, 'Measurements - Bublik']);
};
