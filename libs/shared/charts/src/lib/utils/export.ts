/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { writeFile, utils, WorkSheet, WorkBook } from 'xlsx';

import { SingleMeasurementChart } from '@/services/bublik-api';

export const saveAsXLSX = (
	fileName: string,
	plots: SingleMeasurementChart[]
) => {
	const addResults = (ws: WorkSheet, plot: SingleMeasurementChart) => {
		utils.sheet_add_aoa(ws, plot.dataset, { origin: 'A1' });
	};

	const calculateToolWidth = (ws: WorkSheet, plot: SingleMeasurementChart) => {
		ws['!cols'] = plot.dataset[0].map((header) => {
			return { wch: header.toString().length + 5 };
		});
	};

	const addToolAndType = (plot: SingleMeasurementChart): WorkSheet => {
		const ws = utils.aoa_to_sheet(plot.dataset);
		calculateToolWidth(ws, plot);

		return ws;
	};

	const generateExcelSheets =
		(wb: WorkBook) => (plot: SingleMeasurementChart, idx: number) => {
			const ws = addToolAndType(plot);
			addResults(ws, plot);

			const name = plot.title || plot.subtitle || `Plot ${idx}`;
			const sanitizedTitle = name.replace(
				/[:]|[\\]|[\\/]|[?]|[[]|[\]]|[*]/g,
				'#'
			);
			const withId = `${idx} ${sanitizedTitle}`.slice(0, 31);

			utils.book_append_sheet(wb, ws, withId);
		};

	/** Main Logic */
	const wb = utils.book_new();

	plots.forEach(generateExcelSheets(wb));

	writeFile(wb, `${fileName}.xlsx`, { bookType: 'xlsx' });
};

export const saveAsCSV = (
	fileName: string,
	plots: SingleMeasurementChart[]
) => {
	const getCVSRows = (plots: SingleMeasurementChart[]) => {
		const preparedData: (string | null | number)[][] = [];

		plots.forEach((plot) => {
			preparedData.push(...plot.dataset);
			preparedData.push([]);
		});

		return preparedData;
	};

	/** Main Logic */
	const wb = utils.book_new();

	const rows = getCVSRows(plots);
	const ws = utils.aoa_to_sheet(rows);
	utils.book_append_sheet(wb, ws);

	writeFile(wb, `${fileName}.csv`, { bookType: 'csv' });
};
