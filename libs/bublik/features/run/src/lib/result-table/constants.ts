import { z } from 'zod';

const COLUMN_ID = {
	REQUIREMENTS: 'requirements',
	PARAMETERS: 'parameters',
	OBTAINED_RESULT: 'obtained-result',
	ARTIFACTS: 'artifacts'
} as const;

const ObtainedResultFilterSchema = z
	.object({
		verdicts: z.array(z.string()),
		isNotExpected: z.boolean().optional(),
		result: z.string().optional()
	})
	.default({ verdicts: [] })
	.catch({ verdicts: [] });

const StringArraySchema = z.array(z.string()).default([]);

type ObtainedResultFilter = z.infer<typeof ObtainedResultFilterSchema>;

export {
	COLUMN_ID,
	ObtainedResultFilterSchema,
	StringArraySchema,
	type ObtainedResultFilter
};
