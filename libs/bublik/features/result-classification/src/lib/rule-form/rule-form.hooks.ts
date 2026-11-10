/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	RuleFormSchema,
	RuleFormValues,
	RuleForm,
	RuleFormSeed
} from './rule-form.types';
import { ruleToFormValues } from './rule-form.utils';

/**
 * The form follows the rule it is seeded from: when the rule changes (a save
 * refetches it) the form resets to it, unless it holds edits of its own.
 */
export function useRuleForm(seed: RuleFormSeed): RuleForm {
	const form = useForm<RuleFormValues>({
		resolver: zodResolver(RuleFormSchema),
		defaultValues: ruleToFormValues(seed)
	});

	const isDirty = form.formState.isDirty;

	useEffect(() => {
		if (!seed.rule || isDirty) return;

		form.reset(ruleToFormValues(seed));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [seed.rule, isDirty]);

	return form;
}
