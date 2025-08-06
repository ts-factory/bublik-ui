/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ExportExtensions } from '../export-chart';
import { SingleMeasurementChart } from '@/services/bublik-api';

export interface UseExportConfig {
	plots?: SingleMeasurementChart[];
}

export const useExportChart = (config: UseExportConfig) => {
	const { plots } = config;

	const handleExportClick = async (fileExtension: ExportExtensions) => {
		try {
			const { saveAsCSV, saveAsXLSX } = await import('../utils/export');

			if (!plots) return;

			const chartsNames = plots
				.map((p) => p.title ?? p.subtitle)
				.join(' & ')
				.slice(0, 31)
				.replace(/:|\\|[\\/]|[?]|]|[*]/, '#');

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
