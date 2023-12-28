/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useParams } from 'react-router-dom';

import { MeasurementsRouterParams } from '@/shared/types';
import { TableHeader } from '@/shared/charts';

import {
	ExportChartContainer,
	MeasurementStatisticsContainer,
	TablesContainer
} from '../../containers';

export const ModeTables = () => {
	const { runId, resultId } = useParams<MeasurementsRouterParams>();

	if (!runId || !resultId) return null;

	return (
		<div className="p-2">
			<div className="flex flex-col gap-1">
				<MeasurementStatisticsContainer />
				<div className="bg-white rounded-md">
					<TableHeader>
						<ExportChartContainer resultId={resultId} />
					</TableHeader>
					<TablesContainer resultId={resultId} />
				</div>
			</div>
		</div>
	);
};
