/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { MeasurementPlot } from '@/shared/types';

import { ExportExtensions } from '../export-chart';

export interface UseExportConfig {
	plots?: MeasurementPlot[];
}

export const useExportChart = (config: UseExportConfig) => {
	const { plots } = config;

	const handleExportClick = async (fileExtension: ExportExtensions) => {
		try {
			const { getChartName, saveAsCSV, saveAsXLSX } = await import('../utils');

			if (!plots) return;

			const chartsNames = plots
				.map(getChartName)
				.join(' & ')
				.slice(0, 31)
				.replace(/[:]|[\\]|[\\/]|[?]|[[]|[\]]|[*]/, '#');

			switch (fileExtension) {
				case '.xlsx':
					saveAsXLSX(chartsNames, plots);
					break;
				case '.csv':
					saveAsCSV(chartsNames, plots);
					break;
				default:
					console.error('Unsupported file extension');
			}
		} catch (e) {
			console.error("Failed to import 'export-plot' module");
		}
	};

	return { handleExportClick };
};
