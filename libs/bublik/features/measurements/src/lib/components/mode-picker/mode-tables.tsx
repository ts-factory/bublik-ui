/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { TableHeader } from '@/shared/charts';

import {
	ExportChartContainer,
	MeasurementStatisticsContainer,
	TablesContainer
} from '../../containers';
import { measurementsRoute } from '../../route';

export const ModeTables = () => {
	const { resultId } = measurementsRoute.useParams();

	return (
		<div className="p-2">
			<div className="flex flex-col gap-1">
				<MeasurementStatisticsContainer />
				<div className="bg-bg-primary rounded-md">
					<TableHeader>
						<ExportChartContainer resultId={resultId} />
					</TableHeader>
					<TablesContainer resultId={resultId} />
				</div>
			</div>
		</div>
	);
};
