/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useParams } from 'react-router-dom';

import { CardHeader, Resizable, resizableStyles } from '@/shared/tailwind-ui';
import { MeasurementsRouterParams } from '@/shared/types';
import { TableHeader } from '@/shared/charts';

import {
	ChartsContainer,
	ExportChartContainer,
	MeasurementStatisticsContainer,
	TablesContainer
} from '../../containers';

export const ModeSplit = () => {
	const { runId, resultId } = useParams<MeasurementsRouterParams>();

	if (!runId || !resultId) return null;

	return (
		<div className="h-screen p-2 overflow-hidden">
			<div className="flex flex-col h-full gap-1">
				<MeasurementStatisticsContainer />
				<div className="flex gap-1 overflow-hidden">
					<Resizable
						{...resizableStyles}
						defaultSize={{ width: '50%', height: '100%' }}
						enable={{ right: true }}
						maxWidth="70%"
						minWidth={500}
					>
						<div className="flex flex-col flex-grow w-full h-full overflow-hidden bg-white rounded-md">
							<CardHeader label="Charts" />
							<div className="overflow-x-hidden overflow-y-auto no-bg-scrollbar">
								<ChartsContainer layout="row" resultId={resultId} />
							</div>
						</div>
					</Resizable>

					<div className="flex flex-col flex-grow w-full h-full overflow-hidden bg-white rounded-md">
						<TableHeader>
							<ExportChartContainer resultId={resultId} />
						</TableHeader>
						<div className="overflow-x-hidden overflow-y-auto no-bg-scrollbar">
							<TablesContainer resultId={resultId} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
