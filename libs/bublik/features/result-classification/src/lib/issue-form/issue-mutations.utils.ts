import type { Issue } from '@/shared/types';

import { composeBugKey } from '../shared/bug-key.utils';
import { applyServerErrors } from '../shared/server-errors.utils';
import type { IssueForm, IssueFormValues } from './issue-form.types';

export const FIELD_BY_PATH: Record<string, keyof IssueFormValues> = {
	title: 'title',
	description: 'description',
	bug_key: 'bugKey',
	state: 'state'
};

export const LABEL_BY_PATH: Record<string, string> = {
	title: 'Title',
	description: 'Description',
	bug_key: 'Bug key',
	state: 'State'
};

export function applyIssueErrors(error: unknown, form: IssueForm) {
	applyServerErrors(error, form, {
		fieldForPath: (path) => FIELD_BY_PATH[path] ?? null,
		labelByPath: LABEL_BY_PATH
	});
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
