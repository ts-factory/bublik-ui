/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import { useGetSingleMeasurementQuery } from '@/services/bublik-api';
import { ExportChart } from '@/shared/charts';

export interface ExportChartProps {
	resultId: string;
}

export const ExportChartContainer: FC<ExportChartProps> = ({ resultId }) => {
	const { data, isError, isLoading } = useGetSingleMeasurementQuery(resultId);

	return <ExportChart plots={data} disabled={isError} isLoading={isLoading} />;
};
