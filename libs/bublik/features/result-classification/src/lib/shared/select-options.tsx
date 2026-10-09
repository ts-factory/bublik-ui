/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';

import type { SelectValue } from '@/shared/tailwind-ui';

import {
	CategoryBadge,
	DispositionBadge,
	IssueStateBadge,
	RuleActiveBadge
} from '../classification/classification-badges.component';
import {
	CATEGORY_META,
	CATEGORY_ORDER,
	DISPOSITION_META,
	DISPOSITION_ORDER
} from '../classification/classification.constants';
import {
	issueStateMeta,
	ruleActiveMeta
} from '../classification/classification.utils';

/**
 * The form selects speak the tables' vocabulary: each option is the badge a
 * table cell shows for the same value, so "DEFECT" in a rule row is "DEFECT"
 * in the drawer that edits it. The line under each is the badge's tooltip,
 * there to choose by rather than hover for.
 */
export const CATEGORY_SELECT_OPTIONS: SelectValue[] = CATEGORY_ORDER.map(
	(value) => ({
		value,
		displayValue: CATEGORY_META[value].label,
		description: CATEGORY_META[value].description,
		render: <CategoryBadge category={value} />
	})
);

/** A disposition back to the `expected` flag its badge is drawn from. */
export const EXPECTED_BY_DISPOSITION = {
	expected: true,
	unexpected: false,
	none: null
} as const;

export const EXPECTED_SELECT_OPTIONS: SelectValue[] = DISPOSITION_ORDER.map(
	(value) => ({
		value,
		displayValue: DISPOSITION_META[value].label,
		description: DISPOSITION_META[value].description,
		render: <DispositionBadge expected={EXPECTED_BY_DISPOSITION[value]} />
	})
);

export const RULE_ACTIVE_SELECT_OPTIONS: SelectValue[] = [true, false].map(
	(active) => ({
		value: active ? 'active' : 'inactive',
		displayValue: ruleActiveMeta(active).label,
		description: ruleActiveMeta(active).description,
		render: <RuleActiveBadge active={active} />
	})
);

/**
 * The badge's tooltip speaks of one run; the edit form's hint is about what the
 * state does to the issue's rules, in a line short enough to stay one line.
 */
const ISSUE_STATE_HINT = {
	open: 'Its rules apply. Closing deactivates them.',
	closed: 'Its rules are off, and their failures count again.'
} as const;

export const ISSUE_STATE_SELECT_OPTIONS: SelectValue[] = (
	['open', 'closed'] as const
).map((state) => ({
	value: state,
	displayValue: issueStateMeta(state).label,
	description: ISSUE_STATE_HINT[state],
	render: <IssueStateBadge state={state} />
}));

export interface SelectedOptionHintProps {
	options: SelectValue[];
	value: string | undefined;
}

/**
 * The picked option's help line, under its select. The list shows it beside
 * every option while open, and the trigger leaves it out, so once a value is
 * chosen this is what still says what it means.
 */
export function SelectedOptionHint({
	options,
	value
}: SelectedOptionHintProps) {
	const description = options.find(
		(option) => option.value === value
	)?.description;

	if (description === undefined) return null;

	return <FieldHint testId="select-hint">{description}</FieldHint>;
}

export interface FieldHintProps {
	children: ReactNode;
	testId?: string;
}

/**
 * One muted line under a form field, saying what the field is for. `pl-2`, so
 * it starts where the field's floating label and the section headers do.
 */
export function FieldHint({ children, testId = 'field-hint' }: FieldHintProps) {
	return (
		<p className="pl-2 mt-1 text-xs text-text-menu" data-testid={testId}>
			{children}
		</p>
	);
}
