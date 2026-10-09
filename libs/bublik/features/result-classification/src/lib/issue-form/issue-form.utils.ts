import type { Issue } from '@/shared/types';

import { splitBugKey } from '../shared/bug-key.utils';
import { IssueFormValues } from './issue-form.types';

export function issueToFormValues(
	issue?: Issue | null,
	projectId?: number
): IssueFormValues {
	const split = issue?.bug_key ? splitBugKey(issue.bug_key) : null;

	return {
		project: issue?.project ?? projectId ?? 0,
		title: issue?.title ?? '',
		description: issue?.description ?? '',
		tracker: split?.tracker ?? '',
		bugKey: split?.key ?? '',
		state: issue?.state ?? 'open'
	};
}
