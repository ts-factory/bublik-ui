import { type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { refineBugKeyHalves } from '../shared/bug-key.utils';

export const IssueFormShape = z.object({
	title: z.string().min(1, { message: 'Title is required' }),
	description: z.string().optional(),
	tracker: z.string().optional(),
	bugKey: z.string().optional(),
	state: z.enum(['open', 'closed'])
});

export const IssueFormSchema = IssueFormShape.superRefine((values, ctx) => {
	refineBugKeyHalves(values, ctx);
});

export type IssueFormValues = z.infer<typeof IssueFormShape>;

export type IssueForm = UseFormReturn<IssueFormValues>;
