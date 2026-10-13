import { type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import type { IssueRule } from '@/shared/types';

export const RuleFormShape = z.object({
	project: z.coerce.number().int().positive({ message: 'Select a project' }),
	issue: z.coerce.number().int().positive({ message: 'Select an issue' }),
	test: z.coerce.number().int().positive({ message: 'Select a test' }),
	category: z.string().min(1, { message: 'Category is required' }),
	expected: z.enum(['expected', 'unexpected', 'none']),
	active: z.enum(['active', 'inactive']),
	parameters: z.array(z.object({ id: z.string(), value: z.string() })),
	verdicts: z.array(z.object({ id: z.string(), value: z.string() })),
	tags: z.array(z.object({ id: z.string(), value: z.string() }))
});

export const RuleFormSchema = RuleFormShape;

export type RuleFormValues = z.infer<typeof RuleFormShape>;

export type RuleForm = UseFormReturn<RuleFormValues>;

export interface RuleFormSeed {
	rule?: IssueRule | null;
	projectId?: number;
	issueId?: number;
	testId?: number;
}
