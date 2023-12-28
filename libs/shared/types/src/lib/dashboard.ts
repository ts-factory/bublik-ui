/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { RUN_STATUS } from './run';

export const enum DASHBOARD_MODE {
	Rows = 'rows',
	RowsLine = 'rows-line',
	Columns = 'columns'
}

export type DashboardModeValue = 'rows' | 'columns' | 'rows-line';

export type DashboardMode = DASHBOARD_MODE | DashboardModeValue;

/**
|--------------------------------------------------
| API QUERY
|--------------------------------------------------
*/

export interface DashboardAPIQuery {
	date: string;
}

/** Cell context value is used for determining badge color */
export const enum CELL_CONTEXT {
	Success = 'success',
	Error = 'error',
	Warning = 'warning'
}

/** Cell context value is used for determining badge color */
export type CellContextValue = 'success' | 'error' | 'warning';

/**
|--------------------------------------------------
| CELL
|--------------------------------------------------
*/

/** Header from api which is used for accessors */
export type DashboardAPIHeader = {
	key: string;
	name: string;
};

/** When data for cell is an array*/
export type DashboardCellArray = {
	value?: string;
};

/** When data for cell is just an object with value and some context */
export type DashboardCellData = {
	value?: string | number;
	context?: CELL_CONTEXT | CellContextValue;
	payload?: DashboardCellDataMeta;
};

/** Cell which is a link has some meta to build URL */
export interface DashboardCellDataMeta {
	url?: string;
	params?: number;
}

/** Cell can be either an array or an object  */
export type DashboardCell = DashboardCellData | DashboardCellArray[];

/** Dashboard where keys are corresponding columns and values are cells */
export type DashboardRowCells = Record<string, DashboardCell>;

/** Context for dashboard row */
export type DashboardRowContext = {
	start: number;
	run_id: number;
	conclusion: RUN_STATUS;
	status: string;
	status_by_nok: string;
};

/** Dashboard row data */
export type DashboardData = {
	row_cells: DashboardRowCells;
	context: DashboardRowContext;
};

/** This map is used for dashboard sub row description */
export type DashboardCellMeta = Record<string, string>;

/**
|--------------------------------------------------
| API TYPES
|--------------------------------------------------
*/

/** Dashboard API response */
export type DashboardAPIResponse = {
	date: string;
	rows: DashboardData[];
	header: DashboardAPIHeader[];
	payload: DashboardCellMeta;
};

export type DashboardModeResponse = {
	mode: { days: number; columns: number };
};

export type DashboardResponseV2 = {
	table: {
		rows: DashboardAPIResponse['rows'];
		payload: DashboardAPIResponse['payload'];
	} | null;
	headers: DashboardAPIResponse['header'];
	date: Date;
	context: Record<string, string>;
};

export type DashboardQueryParams = { date?: Date | null };
