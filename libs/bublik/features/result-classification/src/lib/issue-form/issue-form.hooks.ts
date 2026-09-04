/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Issue } from '@/shared/types';
import {
	IssueFormSchema,
	IssueFormValues,
	IssueForm
} from './issue-form.types';
import { issueToFormValues } from './issue-form.utils';

export function useIssueForm(issue?: Issue | null): IssueForm {
	const form = useForm<IssueFormValues>({
		resolver: zodResolver(IssueFormSchema),
		defaultValues: issueToFormValues(issue)
	});

	const isDirty = form.formState.isDirty;

	useEffect(() => {
		if (!issue || isDirty) return;

		form.reset(issueToFormValues(issue));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [issue, isDirty]);

	return form;
}
