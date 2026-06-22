/* SPDX-License-Identifier: Apache-2.0 */
import type { ResultIssueRef } from '@/shared/types';
import { Badge } from '@/shared/tailwind-ui';

export interface IssueBadgesProps {
	issues?: ResultIssueRef[];
}

/** Issue key + category badges for classifications stamped on a result,
 * shown under the obtained result. */
export function IssueBadges({ issues }: IssueBadgesProps) {
	if (!issues || issues.length === 0) return null;

	return (
		<div className="flex flex-wrap gap-1 mt-1">
			{issues.map((issue) => (
				<Badge
					key={issue.rule_id}
					variant={issue.expected ? 'expected' : 'unexpected'}
					title={issue.issue_title}
				>
					{(issue.bug_key ?? `#${issue.issue_id}`) + ' · ' + issue.category}
				</Badge>
			))}
		</div>
	);
}
