/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';
import {
	countedFacetOptions,
	groupRowId,
	reconcileColumnOrder
} from './classification-table.utils';

const DEFAULT_ORDER = ['status', 'key', 'issue', 'state', 'actions'];
const PINS = { first: ['status'], last: ['actions'] };

describe('reconcileColumnOrder', () => {
	it('falls back to the default order when nothing was saved', () => {
		expect(reconcileColumnOrder(undefined, DEFAULT_ORDER, PINS)).toEqual(
			DEFAULT_ORDER
		);
		expect(reconcileColumnOrder([], DEFAULT_ORDER, PINS)).toEqual(
			DEFAULT_ORDER
		);
	});

	it('keeps the order the reader chose', () => {
		expect(
			reconcileColumnOrder(
				['status', 'issue', 'key', 'state', 'actions'],
				DEFAULT_ORDER,
				PINS
			)
		).toEqual(['status', 'issue', 'key', 'state', 'actions']);
	});

	it('drops ids the table no longer has', () => {
		expect(
			reconcileColumnOrder(
				['status', 'project', 'key', 'issue', 'state', 'actions'],
				DEFAULT_ORDER,
				PINS
			)
		).toEqual(DEFAULT_ORDER);
	});

	it('slots a new column in after its default predecessor, not at the end', () => {
		// The table gained `state` since the order was saved. Its default
		// predecessor is `issue`, which the reader moved left, so `state`
		// follows it there rather than landing after `actions`.
		expect(
			reconcileColumnOrder(
				['status', 'issue', 'key', 'actions'],
				DEFAULT_ORDER,
				PINS
			)
		).toEqual(['status', 'issue', 'state', 'key', 'actions']);
	});

	it('holds the pinned columns at their ends whatever was saved', () => {
		expect(
			reconcileColumnOrder(
				['actions', 'key', 'status', 'issue', 'state'],
				DEFAULT_ORDER,
				PINS
			)
		).toEqual(['status', 'key', 'issue', 'state', 'actions']);
	});

	it('ignores a pin the table does not have', () => {
		expect(
			reconcileColumnOrder(['key', 'issue'], ['key', 'issue'], {
				first: ['status'],
				last: ['actions']
			})
		).toEqual(['key', 'issue']);
	});

	it('keeps only the first of a duplicated id', () => {
		expect(
			reconcileColumnOrder(
				['status', 'key', 'key', 'issue', 'state', 'actions'],
				DEFAULT_ORDER,
				PINS
			)
		).toEqual(DEFAULT_ORDER);
	});
});

describe('groupRowId', () => {
	it('matches the id the table gives a top-level grouped row', () => {
		expect(groupRowId('project', 7)).toBe('project:7');
		expect(groupRowId('rule_project', '9')).toBe('rule_project:9');
	});
});

describe('countedFacetOptions', () => {
	it('keeps the count and the long form a short label is searched by', () => {
		expect(
			countedFacetOptions({
				counts: { 'product-defect': 17, env: 0 },
				order: ['product-defect', 'env'] as const,
				labelFor: (value) => (value === 'env' ? 'Env' : 'Defect'),
				keywordsFor: (value) => [
					value === 'env' ? 'Environment / infra' : 'Product defect'
				]
			})
		).toEqual([
			{
				value: 'product-defect',
				label: 'Defect (17)',
				count: 17,
				keywords: ['Product defect']
			}
		]);
	});
});
