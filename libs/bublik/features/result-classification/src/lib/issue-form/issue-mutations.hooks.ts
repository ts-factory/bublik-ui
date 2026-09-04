/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useCallback } from 'react';

import {
	useCloseIssueMutation,
	useCreateIssueMutation,
	useDeleteIssueMutation,
	useReopenIssueMutation,
	useUpdateIssueMutation
} from '@/services/bublik-api';
import { toast } from '@/shared/tailwind-ui';
import type { Issue } from '@/shared/types';

import { composeBugKey } from '../shared/bug-key.utils';
import {
	applyServerErrors,
	serverErrorText
} from '../shared/server-errors.utils';
import type { IssueForm, IssueFormValues } from './issue-form.component';

const FIELD_BY_PATH: Record<string, keyof IssueFormValues> = {
	title: 'title',
	description: 'description',
	bug_key: 'bugKey',
	state: 'state'
};

const LABEL_BY_PATH: Record<string, string> = {
	title: 'Title',
	description: 'Description',
	bug_key: 'Bug key',
	state: 'State'
};

function applyIssueErrors(error: unknown, form: IssueForm) {
	applyServerErrors(error, form, {
		fieldForPath: (path) => FIELD_BY_PATH[path] ?? null,
		labelByPath: LABEL_BY_PATH
	});
}

export interface SaveIssueArgs {
	values: IssueFormValues;
	issue?: Issue | null;
	projectId?: number;
}

export function buildIssueUpdateBody(
	values: IssueFormValues,
	issue: Issue
): { title: string; description: string | null; bug_key?: string | null } {
	const nextBugKey = composeBugKey(values.tracker, values.bugKey) ?? null;
	const currentBugKey = issue.issue_ext?.key ?? null;

	return {
		title: values.title.trim(),
		description: values.description?.trim() || null,
		...(nextBugKey !== currentBugKey ? { bug_key: nextBugKey } : null)
	};
}

export function issueStateTransition(
	values: IssueFormValues,
	issue: Issue
): 'close' | 'reopen' | null {
	if (values.state === issue.state) return null;

	return values.state === 'closed' ? 'close' : 'reopen';
}

export function useSaveIssue() {
	const [createIssue] = useCreateIssueMutation();
	const [updateIssue] = useUpdateIssueMutation();
	const [closeIssue] = useCloseIssueMutation();
	const [reopenIssue] = useReopenIssueMutation();

	return useCallback(
		async ({ values, issue, projectId }: SaveIssueArgs): Promise<Issue> => {
			const isEdit = Boolean(issue);

			async function run(): Promise<Issue> {
				if (!issue) {
					return createIssue({
						projectId,
						title: values.title.trim(),
						description: values.description?.trim() || null,
						bug_key: composeBugKey(values.tracker, values.bugKey) ?? null
					}).unwrap();
				}

				let saved = await updateIssue({
					issueId: issue.id,
					projectId,
					...buildIssueUpdateBody(values, issue)
				}).unwrap();

				const transition = issueStateTransition(values, issue);

				if (transition) {
					const move = transition === 'close' ? closeIssue : reopenIssue;

					saved = await move({ issueId: issue.id, projectId }).unwrap();
				}

				return saved;
			}

			const promise = run();

			toast.promise(promise, {
				loading: isEdit ? 'Saving issue...' : 'Creating issue...',
				success: isEdit ? 'Issue saved' : 'Issue created',
				error: serverErrorText,
				position: 'top-center'
			});

			return promise;
		},
		[createIssue, updateIssue, closeIssue, reopenIssue]
	);
}

export function buildIssueSubmitHandler(
	save: (values: IssueFormValues) => Promise<unknown>,
	form: IssueForm,
	onDone: () => void
) {
	return async (values: IssueFormValues) => {
		form.clearErrors('root');

		try {
			await save(values);
		} catch (error: unknown) {
			applyIssueErrors(error, form);
			return;
		}

		onDone();
	};
}

export interface DeleteIssueArgs {
	issueId: number;
	projectId?: number;
}

export function useDeleteIssue() {
	const [deleteIssue] = useDeleteIssueMutation();

	return useCallback(
		async ({ issueId, projectId }: DeleteIssueArgs) => {
			const promise = deleteIssue({ issueId, projectId }).unwrap();

			toast.promise(promise, {
				loading: 'Deleting issue...',
				success: 'Issue deleted',
				error: serverErrorText,
				position: 'top-center'
			});

			return promise;
		},
		[deleteIssue]
	);
}
