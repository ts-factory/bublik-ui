import { type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { refineBugKeyHalves } from '../shared/bug-key.utils';

const TestPicksShape = z.object({
	parameters: z.array(z.string()).nullable(),
	// Kept whole or dropped: the server matches verdicts exactly.
	verdicts: z.boolean().nullable()
});

export const ClassifyFormShape = z.object({
	mode: z.enum(['new', 'existing']),
	issueId: z.coerce.number().optional(),
	title: z.string().optional(),
	tracker: z.string().optional(),
	bugKey: z.string().optional(),
	categories: z
		.array(z.string())
		.min(1, { message: 'Select at least one category' }),
	scope: z.enum(['future', 'oneoff']),
	expected: z.enum(['expected', 'unexpected', 'none']),
	// What the match scope keeps, per test; null leaves a dimension at its
	// default. See `ScopePicks` in match-scope.utils.ts.
	picks: z.object({
		tags: z.array(z.string()).nullable(),
		tests: z.record(z.string(), TestPicksShape),
		fallback: TestPicksShape.nullable()
	})
});

export const ClassifyFormSchema = ClassifyFormShape.superRefine(
	(values, ctx) => {
		const title = values.title?.trim() ?? '';

		if (values.mode === 'existing') {
			if (!values.issueId) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['issueId'],
					message: 'Select an issue'
				});
			}

			return;
		}

		if (!title) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['title'],
				message: 'Title is required'
			});
		}

		refineBugKeyHalves(values, ctx);
	}
);

export type ClassifyFormValues = z.infer<typeof ClassifyFormShape>;

export type ClassifyForm = UseFormReturn<ClassifyFormValues>;
