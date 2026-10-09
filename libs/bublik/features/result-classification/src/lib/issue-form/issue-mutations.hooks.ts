/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useCallback } from 'react';

import {
	useCloseIssuesMutation,
	useCreateIssueMutation,
	useDeleteIssueMutation,
	useReopenIssuesMutation,
	useUpdateIssueMutation
} from '@/services/bublik-api';
import { toast } from '@/shared/tailwind-ui';
import type { Issue } from '@/shared/types';

import { composeBugKey } from '../shared/bug-key.utils';
import { serverErrorText } from '../shared/server-errors.utils';
import type { IssueFormValues } from './issue-form.types';
import {
	buildIssueUpdateBody,
	issueStateTransition
} from './issue-mutations.utils';

export interface SaveIssueArgs {
	values: IssueFormValues;
	issue?: Issue | null;
	projectId?: number;
}

export function useSaveIssue() {
	const [createIssue] = useCreateIssueMutation();
	const [updateIssue] = useUpdateIssueMutation();
	const [closeIssues] = useCloseIssuesMutation();
	const [reopenIssues] = useReopenIssuesMutation();

	return useCallback(
		async ({ values, issue, projectId }: SaveIssueArgs): Promise<Issue> => {
			const isEdit = Boolean(issue);

			async function run(): Promise<Issue> {
				if (!issue) {
					return createIssue({
						project: values.project,
						title: values.title.trim(),
						description: values.description?.trim() || null,
						bug_key: composeBugKey(values.tracker, values.bugKey) ?? null
					}).unwrap();
				}

				const saved = await updateIssue({
					issueId: issue.id,
					projectId,
					...buildIssueUpdateBody(values, issue)
				}).unwrap();

				const transition = issueStateTransition(values, issue);

				if (!transition) return saved;

				// close/reopen are bulk actions that answer with a count, not with
				// the issue, so the row we return is the updated one with `state`
				// moved to where the transition put it.
				const move = transition === 'close' ? closeIssues : reopenIssues;

				await move({ ids: [issue.id], projectId }).unwrap();

				return {
					...saved,
					state:
						transition === 'close' ? ('closed' as const) : ('open' as const)
				};
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
		[createIssue, updateIssue, closeIssues, reopenIssues]
	);
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
