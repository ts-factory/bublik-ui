import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	RuleFormSchema,
	RuleFormValues,
	RuleForm,
	RuleFormSeed
} from './rule-form.types';
import { ruleToFormValues } from './rule-form.utils';

export function useRuleForm(seed: RuleFormSeed): RuleForm {
	return useForm<RuleFormValues>({
		resolver: zodResolver(RuleFormSchema),
		defaultValues: ruleToFormValues(seed)
	});
}
