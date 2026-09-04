import { type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { refineBugKeyHalves } from '../shared/bug-key.utils';

export const ClassifyFormShape = z.object({
	mode: z.enum(['new', 'existing']),
	issueId: z.coerce.number().optional(),
	title: z.string().optional(),
	tracker: z.string().optional(),
	bugKey: z.string().optional(),
	category: z.string().min(1, { message: 'Category is required' }),
	scope: z.enum(['future', 'oneoff']),
	expected: z.enum(['expected', 'unexpected', 'none']),
	matchParameters: z.boolean(),
	matchVerdicts: z.boolean(),
	matchImportantTags: z.boolean(),
	matchAllTags: z.boolean()
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
