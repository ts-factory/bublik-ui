/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useParams } from 'react-router-dom';

import { MeasurementsRouterParams } from '@/shared/types';
import { CardHeader } from '@/shared/tailwind-ui';

import {
	ChartsContainer,
	MeasurementStatisticsContainer
} from '../../containers';

export const ModeCharts = () => {
	const { runId, resultId } = useParams<MeasurementsRouterParams>();

	if (!runId || !resultId) return null;

	return (
		<div className="p-2">
			<div className="flex flex-col gap-1">
				<MeasurementStatisticsContainer />
				<div className="bg-white rounded-md">
					<CardHeader label="Charts" />
					<ChartsContainer resultId={resultId} layout="row" />
				</div>
			</div>
		</div>
	);
};
