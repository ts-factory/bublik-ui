/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CardHeader } from '@/shared/tailwind-ui';
import { TableHeader } from '@/shared/charts';

import {
	ChartsContainer,
	ExportChartContainer,
	MeasurementStatisticsContainer,
	TablesContainer
} from '../../containers';
import { measurementsRoute } from '../../route';

function ModeDefault() {
	const { resultId } = measurementsRoute.useParams();

	return (
		<div className="p-2">
			<div className="flex flex-col gap-1">
				<MeasurementStatisticsContainer />
				<div className={'relative transition-all bg-bg-primary rounded-md'}>
					<CardHeader label="Charts" />
					<ChartsContainer layout="mosaic" resultId={resultId} />
				</div>
				<div className="bg-bg-primary rounded-md">
					<TableHeader>
						<ExportChartContainer resultId={resultId} />
					</TableHeader>
					<TablesContainer resultId={resultId} />
				</div>
			</div>
		</div>
	);
}

export { ModeDefault };
