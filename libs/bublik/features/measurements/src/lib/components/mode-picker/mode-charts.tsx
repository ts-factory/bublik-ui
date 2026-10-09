/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CardHeader } from '@/shared/tailwind-ui';

import {
	ChartsContainer,
	MeasurementStatisticsContainer
} from '../../containers';
import { measurementsRoute } from '../../route';

export const ModeCharts = () => {
	const { resultId } = measurementsRoute.useParams();

	return (
		<div className="p-2">
			<div className="flex flex-col gap-1">
				<MeasurementStatisticsContainer />
				<div className="bg-bg-primary rounded-md">
					<CardHeader label="Charts" />
					<ChartsContainer resultId={resultId} layout="row" />
				</div>
			</div>
		</div>
	);
};
