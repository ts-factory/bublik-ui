/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { Badge, BadgeVariants, HoverCard } from '@/shared/tailwind-ui';

import { CLASSIFICATION_BADGE_CLASS } from '../../classification/classification.constants';
import { COLUMN_ID } from '../issue-rules-table.constants';
import type { IssueRuleRow } from '../issue-rules-table.types';
import { ruleParameters, ruleTags } from '../issue-rules-table.utils';
import { MatcherValues } from './matcher-values.component';

interface ScopeDetail {
	title: string;
	columnId: string;
	values: string[];
	variant?: BadgeVariants;
	className?: string;
}

/**
 * What a Match Scope chip stands for: the values behind it, styled as the
 * matching column styles them, so the card reads as that column's cell.
 */
function scopeDetail(chip: string, rule: IssueRuleRow): ScopeDetail {
	switch (chip) {
		case 'Params':
			return {
				title: 'Parameters',
				columnId: COLUMN_ID.PARAMETERS,
				values: ruleParameters(rule),
				className: 'bg-badge-1'
			};
		case 'Verdicts':
			return {
				title: 'Verdicts',
				columnId: COLUMN_ID.VERDICTS,
				values: rule.verdicts ?? [],
				variant: BadgeVariants.Transparent
			};
		case 'Tags':
			return {
				title: 'Tags',
				columnId: COLUMN_ID.TAGS,
				values: ruleTags(rule),
				className: 'bg-badge-0'
			};
		default:
			return {
				title: 'Test',
				columnId: COLUMN_ID.SCOPE,
				values: [rule.test_path || rule.test_name]
			};
	}
}

export interface ScopeChipProps {
	chip: string;
	rule: IssueRuleRow;
}

/**
 * One Match Scope chip — Path, Params, Verdicts or Tags — with a hover card
 * showing the values the rule matches on.
 */
export function ScopeChip({ chip, rule }: ScopeChipProps) {
	const detail = scopeDetail(chip, rule);

	return (
		<HoverCard
			openDelay={200}
			closeDelay={100}
			side="bottom"
			align="start"
			sideOffset={4}
			content={
				<div
					className="max-w-md p-3 bg-white border rounded-lg shadow-lg border-border-primary"
					data-testid="scope-hover-card"
				>
					<div className="mb-1.5 text-[0.6875rem] font-semibold leading-[0.875rem] text-text-menu">
						{detail.title}
					</div>
					<MatcherValues
						values={detail.values}
						columnId={detail.columnId}
						variant={detail.variant}
						className={detail.className}
					/>
				</div>
			}
		>
			<span className="inline-flex cursor-default">
				<Badge
					variant={BadgeVariants.Neutral}
					className={CLASSIFICATION_BADGE_CLASS}
				>
					{chip}
				</Badge>
			</span>
		</HoverCard>
	);
}
