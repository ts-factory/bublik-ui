/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import {
	issueRulesParams,
	issuesParams,
	toSearchParams
} from './classification-endpoints';

const BASE = { page: 1, pageSize: 100 };

describe('issuesParams', () => {
	it('sends a category selection as a `;` list', () => {
		expect(issuesParams({ ...BASE, category: ['env'] })).toMatchObject({
			category: 'env'
		});
		expect(issuesParams({ ...BASE, category: ['env', 'flaky'] })).toMatchObject(
			{ category: 'env;flaky' }
		);
	});

	it('sends state and rules as `;` lists', () => {
		expect(
			issuesParams({
				...BASE,
				state: ['open', 'closed'],
				rules: ['enforced', 'dormant']
			})
		).toMatchObject({ state: 'open;closed', rules: 'enforced;dormant' });
	});

	it('withholds an empty selection', () => {
		expect(issuesParams({ ...BASE, category: [] }).category).toBeUndefined();
		expect(issuesParams(BASE).category).toBeUndefined();
	});

	it('sends search and ordering through untouched', () => {
		expect(
			issuesParams({ ...BASE, search: '#42', ordering: '-created_at' })
		).toMatchObject({ search: '#42', ordering: '-created_at' });
	});

	it('drops an empty search rather than filtering on ""', () => {
		expect(issuesParams({ ...BASE, search: '' }).search).toBeUndefined();
	});
});

describe('issueRulesParams', () => {
	it('sends active, category and expected as `;` lists', () => {
		expect(
			issueRulesParams({
				...BASE,
				active: ['true', 'false'],
				category: ['flaky', 'env'],
				expected: ['expected', 'none']
			})
		).toMatchObject({
			active: 'true;false',
			category: 'flaky;env',
			expected: 'expected;none'
		});
	});

	it('scopes to one issue when asked', () => {
		expect(issueRulesParams({ ...BASE, issue: 12 })).toMatchObject({
			issue: 12
		});
	});

	it('sends issue state as a `;` list', () => {
		expect(
			issueRulesParams({ ...BASE, issueState: ['open', 'closed'] })
		).toMatchObject({ issue_state: 'open;closed' });
	});

	it('keeps tags, verdicts and parameters as lists, one param per value', () => {
		expect(
			issueRulesParams({
				...BASE,
				tags: ['linux-mm=519'],
				verdicts: ['expected a; got b', 'Checksum mismatch'],
				parameters: ['payload_len=[0,1200]']
			})
		).toMatchObject({
			tag: ['linux-mm=519'],
			verdict: ['expected a; got b', 'Checksum mismatch'],
			parameter: ['payload_len=[0,1200]']
		});
	});

	it('withholds empty matcher selections', () => {
		const params = issueRulesParams({ ...BASE, tags: [], verdicts: [] });

		expect(params.tag).toBeUndefined();
		expect(params.verdict).toBeUndefined();
	});
});

describe('toSearchParams', () => {
	it('repeats a key per array value and skips undefined', () => {
		const search = toSearchParams({
			project: 3,
			issue_state: 'open;closed',
			verdict: ['expected a; got b', 'b,c'],
			tag: undefined
		});

		expect(search.getAll('verdict')).toEqual(['expected a; got b', 'b,c']);
		expect(search.get('project')).toBe('3');
		expect(search.get('issue_state')).toBe('open;closed');
		expect(search.has('tag')).toBe(false);
	});
});
