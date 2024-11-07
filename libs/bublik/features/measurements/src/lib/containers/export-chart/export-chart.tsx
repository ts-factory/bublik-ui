/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useGetSingleMeasurementQuery } from '@/services/bublik-api';
import { ExportChart } from '@/shared/charts';

interface ExportChartProps {
	resultId: string;
}

function ExportChartContainer({ resultId }: ExportChartProps) {
	const { data, isError, isLoading } = useGetSingleMeasurementQuery(resultId);

	return (
		<ExportChart
			plots={data?.charts}
			disabled={isError}
			isLoading={isLoading}
		/>
	);
}

export { ExportChartContainer, type ExportChartProps };
