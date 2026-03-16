/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { z } from 'zod';
import { RUN_STATUS } from './run';

export const enum DASHBOARD_MODE {
	Rows = 'rows',
	RowsLine = 'rows-line',
	Columns = 'columns'
}

export const DashboardModeSchema = z.enum([
	DASHBOARD_MODE.Rows,
	DASHBOARD_MODE.RowsLine,
	DASHBOARD_MODE.Columns
]);

export type DashboardModeValue = z.infer<typeof DashboardModeSchema>;

export type DashboardMode = z.infer<typeof DashboardModeSchema>;

/**
|--------------------------------------------------
| API QUERY
|--------------------------------------------------
*/

export const DashboardAPIQuerySchema = z.object({
	date: z.string().optional(),
	projects: z.array(z.number()).optional()
});

export type DashboardAPIQuery = z.infer<typeof DashboardAPIQuerySchema>;

/** Cell context value is used for determining badge color */
export const enum CELL_CONTEXT {
	Success = 'success',
	Error = 'error',
	Warning = 'warning'
}

/** Cell context value is used for determining badge color */
export const CellContextValueSchema = z.enum([
	CELL_CONTEXT.Success,
	CELL_CONTEXT.Error,
	CELL_CONTEXT.Warning
]);

export type CellContextValue = z.infer<typeof CellContextValueSchema>;

/**
|--------------------------------------------------
| CELL
|--------------------------------------------------
*/

export const DashboardAPIHeaderSchema = z.object({
	key: z.string(),
	name: z.string()
});

/** Header from api which is used for accessors */
export type DashboardAPIHeader = z.infer<typeof DashboardAPIHeaderSchema>;

/** When data for cell is an array*/
export const DashboardCellArraySchema = z.object({
	value: z.string().optional()
});

export type DashboardCellArray = z.infer<typeof DashboardCellArraySchema>;

/** When data for cell is just an object with value and some context */
/** Cell which is a link has some meta to build URL */
export const DashboardCellDataMetaSchema = z.object({
	url: z.string().optional(),
	params: z.number().optional()
});

export type DashboardCellDataMeta = z.infer<typeof DashboardCellDataMetaSchema>;

export const DashboardCellDataSchema = z.object({
	value: z.union([z.string(), z.number()]).optional(),
	context: CellContextValueSchema.optional(),
	payload: DashboardCellDataMetaSchema.optional()
});

export type DashboardCellData = z.infer<typeof DashboardCellDataSchema>;

/** Cell can be either an array or an object  */
export const DashboardCellSchema = z.union([
	DashboardCellDataSchema,
	z.array(DashboardCellArraySchema)
]);

export type DashboardCell = z.infer<typeof DashboardCellSchema>;

/** Dashboard where keys are corresponding columns and values are cells */
export const DashboardRowCellsSchema = z.record(
	z.string(),
	DashboardCellSchema
);

export type DashboardRowCells = z.infer<typeof DashboardRowCellsSchema>;

/** Context for dashboard row */
export const DashboardRowContextSchema = z.object({
	start: z.number(),
	run_id: z.number(),
	conclusion: z.nativeEnum(RUN_STATUS),
	status: z.string(),
	status_by_nok: z.string(),
	conclusion_reason: z.string().nullable().optional()
});

export type DashboardRowContext = z.infer<typeof DashboardRowContextSchema>;

/** Dashboard row data */
export const DashboardDataSchema = z.object({
	row_cells: DashboardRowCellsSchema,
	context: DashboardRowContextSchema
});

export type DashboardData = z.infer<typeof DashboardDataSchema>;

/** This map is used for dashboard sub row description */
export const DashboardCellMetaSchema = z.record(z.string(), z.string());

export type DashboardCellMeta = z.infer<typeof DashboardCellMetaSchema>;

/**
|--------------------------------------------------
| API TYPES
|--------------------------------------------------
*/

export const DashboardAPIResponseSchema = z.object({
	date: z.string(),
	rows: z.array(DashboardDataSchema),
	header: z.array(DashboardAPIHeaderSchema),
	payload: DashboardCellMetaSchema
});

/** Dashboard API response */
export type DashboardAPIResponse = z.infer<typeof DashboardAPIResponseSchema>;

export const DashboardModeResponseSchema = z.object({
	mode: z.object({
		days: z.number(),
		columns: z.number()
	})
});

export type DashboardModeResponse = z.infer<typeof DashboardModeResponseSchema>;

export const DashboardResponseV2Schema = z.object({
	table: z
		.object({
			rows: z.array(DashboardDataSchema),
			payload: DashboardCellMetaSchema
		})
		.nullable(),
	headers: z.array(DashboardAPIHeaderSchema),
	date: z.date(),
	context: z.record(z.string(), z.string())
});

export type DashboardResponseV2 = z.infer<typeof DashboardResponseV2Schema>;

export const DashboardQueryParamsSchema = z.object({
	date: z.date().nullable().optional()
});

export type DashboardQueryParams = z.infer<typeof DashboardQueryParamsSchema>;
