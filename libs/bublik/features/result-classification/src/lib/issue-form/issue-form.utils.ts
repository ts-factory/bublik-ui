import type { Issue } from '@/shared/types';

import { splitBugKey } from '../shared/bug-key.utils';
import { IssueFormValues } from './issue-form.types';

export function issueToFormValues(issue?: Issue | null): IssueFormValues {
	const split = issue?.issue_ext?.key ? splitBugKey(issue.issue_ext.key) : null;

	return {
		title: issue?.title ?? '',
		description: issue?.description ?? '',
		tracker: split?.tracker ?? '',
		bugKey: split?.key ?? '',
		state: issue?.state ?? 'open'
	};
}
