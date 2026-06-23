/* SPDX-License-Identifier: Apache-2.0 */
import { useState } from 'react';

import {
	getErrorMessage,
	useActivateRuleMutation,
	useDeactivateRuleMutation
} from '@/services/bublik-api';
import { Badge, ButtonTw, Icon, cn, toast } from '@/shared/tailwind-ui';
import type { IssueRule } from '@/shared/types';

import { CATEGORY_OPTIONS } from './category';
import { expectedBadge } from './expected';
import { chipsForFlags } from './match-scope.utils';
import { IssueRuleResults } from './issue-rule-results';

function categoryLabel(category: string): string {
	return CATEGORY_OPTIONS.find((c) => c.value === category)?.displayValue ?? category;
}

function notifyError(err: unknown) {
	const m = getErrorMessage(err);
	return `${m.title}\n${m.description}`;
}

const cellClassName =
	'px-4 py-2 text-sm border-t border-b border-transparent first:border-l last:border-r first:rounded-l last:rounded-r group-hover:border-primary group-hover:first:border-primary group-hover:last:border-primary';

export interface IssueRuleRowProps {
	rule: IssueRule;
	projectId?: number;
}

export function IssueRuleRow({ rule, projectId }: IssueRuleRowProps) {
	const [expanded, setExpanded] = useState(false);
	const [activate, activateState] = useActivateRuleMutation();
	const [deactivate, deactivateState] = useDeactivateRuleMutation();
	const isBusy = activateState.isLoading || deactivateState.isLoading;

	function toggleActive() {
		const action = rule.active ? deactivate : activate;
		const promise = action({ ruleId: rule.id, projectId }).unwrap();
		toast.promise(promise, {
			loading: rule.active ? 'Disabling rule...' : 'Enabling rule...',
			success: rule.active ? 'Rule disabled' : 'Rule enabled',
			error: notifyError,
			position: 'top-center'
		});
	}

	const chips = chipsForFlags({
		matchParameters: rule.match_parameters,
		matchVerdicts: rule.match_verdicts,
		matchImportantTags: rule.match_important_tags,
		matchAllTags: rule.match_all_tags
	});
	const exp = expectedBadge(rule.expected);

	return (
		<>
			<tr className="group">
				<td className={cn(cellClassName, 'font-medium text-text-primary')}>
					{rule.test_name}
				</td>
				<td className={cellClassName}>{categoryLabel(rule.category)}</td>
				<td className={cellClassName}>
					<Badge variant={exp.variant}>{exp.label}</Badge>
				</td>
				<td className={cellClassName}>
					<div className="flex flex-wrap gap-1">
						{chips.map((chip) => (
							<span
								key={chip}
								className="px-1.5 py-0.5 text-[0.6875rem] rounded bg-primary-wash border border-border-primary"
							>
								{chip}
							</span>
						))}
					</div>
				</td>
				<td className={cellClassName}>
					<Badge variant={rule.active ? 'expected' : 'unexpected'}>
						{rule.active ? 'Active' : 'Inactive'}
					</Badge>
				</td>
				<td className={cn(cellClassName, 'text-right')}>
					<div className="inline-flex items-center gap-2">
						<ButtonTw
							variant={rule.active ? 'destruction-secondary' : 'secondary'}
							size="xss"
							state={isBusy ? 'loading' : 'default'}
							onClick={toggleActive}
						>
							{rule.active ? 'Disable' : 'Enable'}
						</ButtonTw>
						<button
							type="button"
							onClick={() => setExpanded((v) => !v)}
							className="inline-flex items-center gap-1 hover:text-primary"
							aria-expanded={expanded}
						>
							Failures
							<Icon
								name="ArrowShortSmall"
								className={cn(
									'grid place-items-center transition-transform',
									expanded ? 'rotate-360' : '-rotate-90'
								)}
							/>
						</button>
					</div>
				</td>
			</tr>
			{expanded ? (
				<tr>
					<td colSpan={6} className="border-b border-border-primary bg-primary-wash/40">
						<IssueRuleResults ruleId={rule.id} projectId={projectId} />
					</td>
				</tr>
			) : null}
		</>
	);
}
