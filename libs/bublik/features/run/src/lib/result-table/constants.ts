/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { z } from 'zod';

import { RESULT_PROPERTIES, ResultTypeSchema } from '@/shared/types';

const COLUMN_ID = {
	REQUIREMENTS: 'requirements',
	PARAMETERS: 'parameters',
	OBTAINED_RESULT: 'obtained-result',
	ARTIFACTS: 'artifacts'
} as const;

const DEFAULT_OBTAINED_RESULT_FILTER = {
	results: [],
	resultProperties: [],
	verdicts: []
};

const ObtainedResultFilterValueSchema = z.object({
	results: z.array(ResultTypeSchema).default([]),
	resultProperties: z
		.enum([
			RESULT_PROPERTIES.Expected,
			RESULT_PROPERTIES.Unexpected,
			RESULT_PROPERTIES.NotRun
		])
		.array()
		.default([]),
	verdicts: z.array(z.string()).default([])
});

const LegacyObtainedResultFilterSchema = z.object({
	verdicts: z.array(z.string()).default([]),
	isNotExpected: z.boolean().optional(),
	result: ResultTypeSchema.optional()
});

function normalizeObtainedResultFilter(value: unknown) {
	const parsedValue = ObtainedResultFilterValueSchema.safeParse(value);

	if (parsedValue.success) {
		return parsedValue.data;
	}

	const legacyValue = LegacyObtainedResultFilterSchema.safeParse(value);

	if (!legacyValue.success) {
		return DEFAULT_OBTAINED_RESULT_FILTER;
	}

	return {
		results: legacyValue.data.result ? [legacyValue.data.result] : [],
		resultProperties:
			typeof legacyValue.data.isNotExpected === 'boolean'
				? [
						legacyValue.data.isNotExpected
							? RESULT_PROPERTIES.Unexpected
							: RESULT_PROPERTIES.Expected
				  ]
				: [],
		verdicts: legacyValue.data.verdicts
	};
}

const ObtainedResultFilterSchema = z
	.preprocess(normalizeObtainedResultFilter, ObtainedResultFilterValueSchema)
	.default(DEFAULT_OBTAINED_RESULT_FILTER)
	.catch(DEFAULT_OBTAINED_RESULT_FILTER);

const StringArraySchema = z.array(z.string()).default([]);

type ObtainedResultFilter = z.infer<typeof ObtainedResultFilterSchema>;

export {
	COLUMN_ID,
	ObtainedResultFilterSchema,
	StringArraySchema,
	type ObtainedResultFilter
};
