/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import type { IssueRule } from '@/shared/types';

import type { RuleFormValues } from './rule-form.types';
import {
	buildRuleCreateBody,
	buildRuleUpdateBody,
	ruleActiveTransition
} from './rule-mutations.utils';

function rule(overrides: Partial<IssueRule> = {}): IssueRule {
	return {
		id: 12,
		project: 3,
		issue: 7,
		category: 'known-issue',
		expected: true,
		active: true,
		test: 42,
		test_name: 'ethtool/reset',
		parameters: {},
		verdicts: [],
		tags: [],
		...overrides
	};
}

function values(overrides: Partial<RuleFormValues> = {}): RuleFormValues {
	return {
		project: 3,
		issue: 7,
		test: 42,
		category: 'known-issue',
		expected: 'expected',
		active: 'active',
		parameters: [{ id: 'env=ci', value: 'env=ci' }],
		verdicts: [{ id: 'timeout', value: 'timeout' }],
		tags: [],
		...overrides
	};
}

describe('buildRuleCreateBody', () => {
	it('converts the chip fields into the matcher the API stores', () => {
		expect(buildRuleCreateBody(values())).toEqual({
			project: 3,
			issue: 7,
			test: 42,
			category: 'known-issue',
			expected: true,
			parameters: { env: 'ci' },
			verdicts: ['timeout'],
			tags: []
		});
	});

	it('never carries active', () => {
		expect(
			buildRuleCreateBody(values({ active: 'inactive' }))
		).not.toHaveProperty('active');
	});

	it('maps the tri-state disposition', () => {
		expect(
			buildRuleCreateBody(values({ expected: 'unexpected' })).expected
		).toBe(false);
		expect(
			buildRuleCreateBody(values({ expected: 'none' })).expected
		).toBeNull();
	});
});

describe('buildRuleUpdateBody', () => {
	it('sends category and disposition and nothing else', () => {
		expect(buildRuleUpdateBody(values())).toEqual({
			category: 'known-issue',
			expected: true
		});
	});

	it.each(['project', 'issue', 'test', 'parameters', 'verdicts', 'tags'])(
		'never carries the locked matcher field %s',
		(field) => {
			expect(buildRuleUpdateBody(values())).not.toHaveProperty(field);
		}
	);
});

describe('ruleActiveTransition', () => {
	it('follows a create-as-inactive with a deactivate', () => {
		expect(ruleActiveTransition(values({ active: 'inactive' }))).toBe(
			'deactivate'
		);
	});

	it('asks for nothing extra when a create wanted it active', () => {
		expect(ruleActiveTransition(values({ active: 'active' }))).toBeNull();
	});

	it('asks for nothing when an edit did not move the flag', () => {
		expect(
			ruleActiveTransition(values({ active: 'active' }), rule())
		).toBeNull();
		expect(
			ruleActiveTransition(
				values({ active: 'inactive' }),
				rule({ active: false })
			)
		).toBeNull();
	});

	it('activates and deactivates on an edit that moved it', () => {
		expect(
			ruleActiveTransition(
				values({ active: 'active' }),
				rule({ active: false })
			)
		).toBe('activate');
		expect(ruleActiveTransition(values({ active: 'inactive' }), rule())).toBe(
			'deactivate'
		);
	});
});
