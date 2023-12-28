/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { writeFile, utils, WorkSheet, WorkBook } from 'xlsx';

import { MeasurementPlot } from '@/shared/types';
import { upperCaseFirstLetter } from '@/shared/utils';
import { getChartName, formatLabel } from './formatting';

const KEYS_TO_REMOVE = {
	id: '',
	measurementId: '',
	xAxisGetter: '',
	yAxisGetter: '',
	dots: ''
};

const isKeyToRemove = (key: string) => key in KEYS_TO_REMOVE;
const isNotKeyToRemove = (key: string) => !isKeyToRemove(key);

const filterKeys = (plot: Record<string, unknown>): Record<string, unknown> => {
	return Object.fromEntries(
		Object.entries(plot).filter(([key]) => isNotKeyToRemove(key))
	);
};

export const saveAsXLSX = (fileName: string, plots: MeasurementPlot[]) => {
	const addHeader = (
		ws: WorkSheet,
		origin: string,
		obj: Record<string, unknown> = {}
	) => {
		utils.sheet_add_aoa(ws, [Object.keys(obj).map(formatLabel)], {
			origin
		});
	};

	const addResults = (ws: WorkSheet, plot: MeasurementPlot) => {
		utils.sheet_add_json(ws, plot.dots, { origin: 'F4' });

		addHeader(ws, 'F4', plot.dots.find((t) => t !== undefined) || {});
	};

	const calculateToolWidth = (ws: WorkSheet, plot: MeasurementPlot) => {
		ws['!cols'] = Object.entries(plot)
			.filter(([key]) => key !== 'dots')
			.map(([key, value]) => {
				return { wch: Math.max(...[key.length, value?.toString().length]) + 5 };
			});
	};

	const addToolAndType = (plot: MeasurementPlot): WorkSheet => {
		const ws = utils.json_to_sheet([filterKeys(plot)]);
		addHeader(ws, 'A1', filterKeys(plot));
		calculateToolWidth(ws, plot);

		return ws;
	};

	const generateExcelSheets =
		(wb: WorkBook) => (plot: MeasurementPlot, idx: number) => {
			const ws = addToolAndType(plot);
			addResults(ws, plot);

			const fullName = getChartName(plot).replace(
				/[:]|[\\]|[\\/]|[?]|[[]|[\]]|[*]/,
				'#'
			);

			const withId = `${idx} ${fullName}`.slice(0, 31);

			utils.book_append_sheet(wb, ws, withId);
		};

	/** Main Logic */
	const wb = utils.book_new();

	plots.forEach(generateExcelSheets(wb));

	writeFile(wb, `${fileName}.xlsx`, { bookType: 'xlsx' });
};

export const saveAsCSV = (fileName: string, plots: MeasurementPlot[]) => {
	const getCVSRows = (plots: MeasurementPlot[]) => {
		const preparedData: (string | null | number)[][] = [];

		const getToolAndTypesRows = (plot: Record<string, unknown>) => {
			const headerRow = Object.keys(plot)
				.filter((key) => isNotKeyToRemove(key))
				.map(upperCaseFirstLetter);

			const valuesRow = Object.entries(plot)
				.filter(([key]) => isNotKeyToRemove(key))
				.map(([key, value]) => {
					if (Array.isArray(value)) return value.join(',');
					if (
						!Array.isArray(value) &&
						(typeof value === 'string' || typeof value === 'number')
					) {
						return value.toString();
					}

					return '-';
				});

			return [headerRow, valuesRow, []];
		};

		const getResultsRows = (plot: MeasurementPlot) => {
			const result: (string | number | null)[][] = [];

			const sampleResult =
				plot.dots.find((dot) => typeof dot !== 'undefined') || {};

			if (sampleResult) {
				result.push(Object.keys(sampleResult).map(formatLabel));
			}

			const resultsRows = plot.dots.map((dot) => Object.values(dot));
			result.push(...resultsRows);
			result.push([]);

			return result;
		};

		plots.forEach((plot) => {
			const rows = getToolAndTypesRows(plot);
			const resultsRows = getResultsRows(plot);

			preparedData.push(...rows);
			preparedData.push(...resultsRows);
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
