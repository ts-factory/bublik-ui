/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { z } from 'zod';

import { LogEntityModelSchema, LevelModelSchema } from './models';

/**
 |--------------------------------------------------
 | LOG HEADER
 |--------------------------------------------------
 */

export const LogHeaderVerdictSchema = z.object({
	verdict: z.string(),
	level: LevelModelSchema
});

export const LogHeaderArtifactSchema = z.object({
	level: LevelModelSchema,
	artifact: z.string()
});

export const LogHeaderAuthorsSchema = z.object({ email: z.string().email() });

export const LogHeaderBlockSchema = z
	.object({
		type: z.literal('te-log-meta'),
		entity_model: LogEntityModelSchema,
		meta: z
			.object({
				start: z.string().describe('date string'),
				end: z.string().describe('date string'),
				duration: z.string().describe('duration of the test'),
				parameters: z
					.array(z.object({ name: z.string(), value: z.string() }))
					.optional()
					.describe('Optional list of parameters'),
				verdicts: z
					.array(LogHeaderVerdictSchema)
					.optional()
					.describe('Optional list of verdicts'),
				objective: z.string().optional().describe('Optional objective'),
				requirements: z
					.array(z.string())
					.optional()
					.describe('Optional list of requirements'),
				authors: z
					.array(LogHeaderAuthorsSchema)
					.optional()
					.describe('Optional List of authors'),
				artifacts: z
					.array(LogHeaderArtifactSchema)
					.optional()
					.describe('Optional list of artifacts'),
				description: z
					.object({ url: z.string().url(), text: z.string() })
					.optional()
					.describe('Optional description with external url')
			})
			.describe('Meta information')
	})
	.describe("Block representing log's header");

export type LogHeaderBlock = z.infer<typeof LogHeaderBlockSchema>;

/**
 |--------------------------------------------------
 | LOG ENTITY LIST
 |--------------------------------------------------
 */

export const LogEntityListBlockSchema = z
	.object({
		type: z.literal('te-log-entity-list'),
		items: z.array(LogEntityModelSchema)
	})
	.describe('Block representing list of package/session children');

export type LogEntityListBlock = z.infer<typeof LogEntityListBlockSchema>;

/**
 |--------------------------------------------------
 | LOG TABLE BLOCKS
 |--------------------------------------------------
 */

export const AxisXSchema = z.object({
	type: z.string().optional(),
	name: z.string().optional()
});

/**
 * Unfortunately, zod fails to parse properly this union, so we have to handle it manually
 * For axis_x there are 3 types of data:
 * { "type": "temperature" } |
 * { "type": "pps", "name": "B-parameter" } |
 * { "type": "pps", "name": "auto-seqno" }
 */
export type LogContentAxisXSchema = z.infer<typeof AxisXSchema>;

export const AxisYSchema = z
	.array(z.object({ type: z.string(), name: z.string().optional() }))
	.optional();

export type LogContentAxisYSchema = z.infer<typeof AxisYSchema>;

export const LogContentMiChartResultsSchema = z
	.array(
		z.object({
			type: z.string(),
			description: z.string(),
			name: z.string().optional(),
			entries: z.array(
				z.object({
					aggr: z.string(),
					value: z.number(),
					base_units: z.string(),
					multiplier: z.string()
				})
			)
		})
	)
	.describe('Array of entries');

export type LogContentMiChartResults = z.infer<
	typeof LogContentMiChartResultsSchema
>;

export const LogContentMiChartSchema = z.object({
	type: z.literal('measurement'),
	version: z.number(),
	tool: z.string(),
	name: z.string().optional(),
	description: z.string().optional(),
	results: LogContentMiChartResultsSchema,
	views: z
		.array(
			z.object({
				name: z.string(),
				type: z.enum(['line-graph']),
				title: z.string(),
				axis_x: AxisXSchema,
				axis_y: AxisYSchema
			})
		)
		.describe('Array of views')
});

export type LogContentMiChart = z.infer<typeof LogContentMiChartSchema>;

export const LogContentMiSchema = z.object({
	type: z.literal('te-log-table-content-mi'),
	content: z.union([LogContentMiChartSchema, z.record(z.unknown())])
});

export type LogContentMiBlock = z.infer<typeof LogContentMiSchema>;

export const LogContentTextBlockSchema = z
	.object({
		type: z.literal('te-log-table-content-text'),
		content: z.string().describe('Text content')
	})
	.describe('Block representing text content inside log table');

export type LogContentTextBlock = z.infer<typeof LogContentTextBlockSchema>;

export const LogContentMemoryDumpSchema = z
	.object({
		type: z.literal('te-log-table-content-memory-dump'),
		dump: z.array(z.array(z.string())).describe('Array of arrays of strings')
	})
	.describe('Block representing memory dump content inside log table');

export type LogContentMemoryDump = z.infer<typeof LogContentMemoryDumpSchema>;

export const LogContentFileSchema = z
	.object({
		type: z.literal('te-log-table-content-file'),
		content: z
			.string()
			.describe('Content string will display as preformatted text')
	})
	.describe('Block representing file content inside log table');

export type LogContentFile = z.infer<typeof LogContentFileSchema>;

export const LogContentSnifferPacketSchema = z.object({
	type: z.literal('te-log-table-content-packet-sniffer'),
	content: z // Array of proto objects
		.array(
			z.object({
				label: z.string(), // proto name or proto show-name,
				content: z.array(z.string()) // Array of strings representing proto fields
			})
		)
});

export type LogContentSnifferPacket = z.infer<
	typeof LogContentSnifferPacketSchema
>;

/**
 |--------------------------------------------------
 | LOG TABLE BLOCK
 |--------------------------------------------------
 */

export const LogJsonTimestampSchema = z.object({
	timestamp: z.number(),
	formatted: z.string()
});

export type LogJsonTimestamp = z.infer<typeof LogJsonTimestampSchema>;

export const LogTableDataBaseSchema = z
	.object({
		line_number: z.number(),
		level: LevelModelSchema,
		entity_name: z.string(),
		user_name: z.string(),
		timestamp: LogJsonTimestampSchema,
		log_content: z
			.array(
				z.discriminatedUnion('type', [
					LogContentTextBlockSchema,
					LogContentMemoryDumpSchema,
					LogContentFileSchema,
					LogContentMiSchema,
					LogContentSnifferPacketSchema
				])
			)
			.describe('Log content accepts series of blocks for displaying data')
	})
	.describe('Log table data');

export type LogTableSchema = z.infer<typeof LogTableDataBaseSchema> & {
	children?: LogTableSchema[];
};

const LogTableDataSchema: z.ZodType<LogTableSchema> =
	LogTableDataBaseSchema.extend({
		children: z
			.lazy(() => LogTableDataSchema.array().optional())
			.describe('Represents nesting level')
	});

export type LogTableData = z.infer<typeof LogTableDataSchema>;

export const LogTableBlockSchema = z
	.object({
		type: z.literal('te-log-table'),
		data: z.array(LogTableDataSchema)
	})
	.describe('Block representing log table');

export type LogTableBlock = z.infer<typeof LogTableBlockSchema>;

export const LogPageSchema = z.object({
	type: z.literal('te-log'),
	pagination: z
		.object({ cur_page: z.number(), pages_count: z.number() })
		.optional()
		.describe(
			'Pagination object `cur_page: 0` represents to display all pages'
		),
	content: z.array(
		z.discriminatedUnion('type', [
			LogHeaderBlockSchema,
			LogEntityListBlockSchema,
			LogTableBlockSchema
		])
	)
});

export type LogPageBlock = z.infer<typeof LogPageSchema>;

/**
 |--------------------------------------------------
 | ROOT BLOCK
 |--------------------------------------------------
 */

export const RootBlockSchema = z
	.object({
		version: z.enum(['v1']).describe('Version of the API used'),
		root: z
			.array(z.discriminatedUnion('type', [LogPageSchema]))
			.describe('Root entry for all block')
	})
	.describe('This is root block of log');

export type RootBlock = z.infer<typeof RootBlockSchema>;
