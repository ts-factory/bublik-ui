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

import { composeBugKey } from './bug-key';
import { applyServerErrors, serverErrorText } from './server-errors';
import type { IssueForm, IssueFormValues } from './issue-form';

/** Wire paths the issue form has a control for. */
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
	/** Absent for a create. */
	issue?: Issue | null;
	projectId?: number;
}

/**
 * The PATCH body for an edit.
 *
 * `bug_key` appears **only when it changed**. The serializer's guard —
 * *"Cannot change the bug key on an issue that already has classified
 * results"* — fires on the key being present in the payload, not on its value
 * differing, so echoing the current key back would reject an edit that never
 * touched it. Pure, and kept apart from the request so that rule can be
 * asserted without standing up a store.
 */
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

/**
 * Which lifecycle call the edit needs, if any. `state` is read-only on the
 * serializer, so this is the second half of what the form asked in one field.
 */
export function issueStateTransition(
	values: IssueFormValues,
	issue: Issue
): 'close' | 'reopen' | null {
	if (values.state === issue.state) return null;

	return values.state === 'closed' ? 'close' : 'reopen';
}

/**
 * Create or update an issue, and move its lifecycle to match the form.
 *
 * This is two requests rather than one because the API splits the work:
 * `IssueSerializer` marks `state` read-only, so open/closed moves only through
 * `POST /issues/{id}/close` and `/reopen`. The form asks the question once; the
 * hook decides how many calls that takes and reports the whole sequence under a
 * single toast.
 */
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

/**
 * The submit handler shape both drawers use: on rejection the messages land on
 * the fields that caused them and the drawer stays open, so the request can be
 * corrected rather than retyped. `onDone` runs on success only.
 */
export function buildIssueSubmitHandler(
	save: (values: IssueFormValues) => Promise<unknown>,
	form: IssueForm,
	onDone: () => void
) {
	return async (values: IssueFormValues) => {
		// Left over from a previous attempt; the field errors are replaced by
		// `setError` below, but a stale root alert would otherwise survive a
		// request that failed for an entirely different reason.
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

/**
 * Deleting an issue is not archiving it. Both FKs into it are `CASCADE`, so the
 * rules under it and every stamp those rules laid go with it — which means runs
 * that were reading as explained start reading as unexplained again. The
 * confirmation wording says so; see `IssueDeleteButton`.
 */
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
