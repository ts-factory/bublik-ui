/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { BadgeVariants } from '@/shared/tailwind-ui';
import type { IssueCategory, ResultIssueRef } from '@/shared/types';

import type { IconName } from './classification.tokens';

export interface CategoryMeta {
	value: IssueCategory;
	label: string;
	displayValue: string;
	description: string;
	variant: BadgeVariants;
	iconName: IconName;
}

export interface IssueStateMeta {
	label: string;
	description: string;
	variant: BadgeVariants;
	iconName: IconName;
}

export type RunIssueEffect = 'suppressed' | 'stale' | 'unexpected' | 'marked';

export interface RunIssueEffectMeta {
	value: RunIssueEffect;
	label: string;
	displayValue: string;
	description: string;
	variant: BadgeVariants;
	stripeClassName: string;
	iconName: IconName;
}

export type Disposition = 'expected' | 'unexpected' | 'none';

export interface DispositionMeta {
	value: Disposition;
	label: string;
	description: string;
	aggregateDescription: string;
	variant: BadgeVariants;
	iconName: IconName;
}

export type IssueRulesState =
	| 'enforced'
	| 'dormant'
	| 'deactivated'
	| 'unruled';

export interface IssueRulesStateMeta {
	value: IssueRulesState;
	label: string;
	description: string;
	variant: BadgeVariants;
	stripeClassName: string;
	iconName: IconName;
}

export type RuleResultOrigin = ResultIssueRef['origin'];

export interface OriginMeta {
	value: RuleResultOrigin;
	label: string;
	description: string;
}
