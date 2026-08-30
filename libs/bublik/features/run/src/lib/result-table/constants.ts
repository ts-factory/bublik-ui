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
	verdicts: [],
	categories: []
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
	verdicts: z.array(z.string()).default([]),
	/**
	 * Issue categories, from the classification chips under a result.
	 *
	 * They ride the obtained-result filter rather than a column of their own
	 * because that is where the chips are rendered -- the same cell as the
	 * verdicts, under the same accessor, which already carries `issues`.
	 *
	 * Kept as bare strings, not the `IssueCategory` union: the value comes out
	 * of a shared URL, and a link written against a category that has since been
	 * renamed should narrow to nothing rather than fail to parse and silently
	 * drop every other filter beside it.
	 */
	categories: z.array(z.string()).default([])
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
		// A link written before classification existed carries no categories.
		categories: [],
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

/**
 * How many values the obtained-result filter is currently holding, across all
 * of its axes.
 *
 * The filter is one column carrying four independent lists, and three separate
 * places need to know whether it holds anything: the analytics event, the
 * toolbar's "has filters" test, and the writer that deletes the entry once the
 * last value is cleared. Each used to spell the axes out by hand, so adding one
 * meant finding all three -- and missing one left a filter that could not be
 * cleared, or a Reset button that never lit up.
 */
function obtainedResultFilterCount(filter: ObtainedResultFilter): number {
	return (
		filter.verdicts.length +
		filter.results.length +
		filter.resultProperties.length +
		filter.categories.length
	);
}

export {
	COLUMN_ID,
	ObtainedResultFilterSchema,
	StringArraySchema,
	obtainedResultFilterCount,
	type ObtainedResultFilter
};
