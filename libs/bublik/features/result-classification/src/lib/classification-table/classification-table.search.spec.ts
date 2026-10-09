/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import {
	columnOverrides,
	defineClassificationSearch,
	idList,
	openRows,
	readTableSearch,
	repeatedFacet,
	sorting,
	toTableWire
} from './classification-table.search';

describe('columnOverrides', () => {
	const codec = columnOverrides();

	it('stays out of the URL when nothing has been chosen', () => {
		expect(codec.serialize({})).toBeUndefined();
	});

	it('writes a sign per column, sorted so one choice is one URL', () => {
		expect(codec.serialize({ verdicts: true, active: false })).toBe(
			'-active;+verdicts'
		);
		expect(codec.serialize({ active: false, verdicts: true })).toBe(
			'-active;+verdicts'
		);
	});

	it('round-trips', () => {
		const overrides = { tags: false, verdicts: true };

		expect(codec.parse(codec.serialize(overrides))).toEqual(overrides);
	});

	it('reads an absent param as absent and an empty one as no choices', () => {
		expect(codec.parse(undefined)).toBeUndefined();
		expect(codec.parse('')).toEqual({});
	});

	it('ignores entries without a sign rather than guessing', () => {
		expect(codec.parse('tags;+verdicts;-')).toEqual({ verdicts: true });
	});

	it('takes the first value when the param is repeated', () => {
		expect(codec.parse(['-tags', '+verdicts'])).toEqual({ tags: false });
	});

	it('hands a typed value back unchanged', () => {
		expect(codec.parse({ tags: false })).toEqual({ tags: false });
	});
});

describe('idList', () => {
	const codec = idList();

	it('stays out of the URL when there is nothing to record', () => {
		expect(codec.serialize([])).toBeUndefined();
	});

	it('writes the ids left to right, `;`-joined', () => {
		expect(codec.serialize(['status', 'rules', 'key'])).toBe(
			'status;rules;key'
		);
	});

	it('round-trips', () => {
		const order = ['status', 'rules', 'key', 'actions'];

		expect(codec.parse(codec.serialize(order))).toEqual(order);
	});

	it('reads an absent param as absent and an empty one as no ids', () => {
		expect(codec.parse(undefined)).toBeUndefined();
		expect(codec.parse('')).toEqual([]);
	});

	it('drops blank entries from a hand-edited link', () => {
		expect(codec.parse(';status; ;key;')).toEqual(['status', 'key']);
	});
});

describe('openRows', () => {
	const codec = openRows();

	// A link to "this issue's results" has to be a link, and a reload must not
	// collapse what was open — so the open rows live in the URL like every other
	// piece of table state.
	it('writes the open rows as a `;`-joined list', () => {
		expect(codec.serialize({ '56': true, '72': true })).toBe('56;72');
	});

	it('leaves closed rows out rather than writing them as false', () => {
		expect(codec.serialize({ '56': true, '72': false })).toBe('56');
	});

	it('writes nothing when everything is closed', () => {
		expect(codec.serialize({})).toBeUndefined();
		expect(codec.serialize({ '56': false })).toBeUndefined();
	});

	// `true` means "every row", which cannot survive a page or filter change —
	// the rows it named may not be there on the way back.
	it('reads the expand-everything state as absent', () => {
		expect(codec.parse(true)).toBeUndefined();
	});

	it('reads back the record TanStack expects', () => {
		expect(codec.parse('56;72')).toEqual({ '56': true, '72': true });
	});

	it('reads an empty param as nothing open', () => {
		expect(codec.parse('')).toEqual({});
		expect(codec.parse(';;')).toEqual({});
	});
});

describe('repeatedFacet', () => {
	const codec = repeatedFacet();

	it('stays out of the URL when nothing is selected', () => {
		expect(codec.serialize([])).toBeUndefined();
	});

	it('writes one param per value, untouched', () => {
		expect(codec.serialize(['a; b', ' c '])).toEqual(['a; b', ' c ']);
	});

	it('reads one value or many, dropping empty ones', () => {
		expect(codec.parse('a; b')).toEqual(['a; b']);
		expect(codec.parse(['a', null, ''])).toEqual(['a']);
		expect(codec.parse(undefined)).toBeUndefined();
	});
});

describe('sorting', () => {
	const codec = sorting();

	it('writes one column and its direction', () => {
		expect(codec.serialize([{ id: 'title', desc: false }])).toBe('title:asc');
		expect(codec.serialize([{ id: 'created', desc: true }])).toBe(
			'created:desc'
		);
	});

	it('writes no sorting as the none sentinel and reads it back', () => {
		expect(codec.serialize([])).toBe('none');
		expect(codec.parse('none')).toEqual([]);
	});

	it('reads a value without a column as absent', () => {
		expect(codec.parse(':asc')).toBeUndefined();
	});

	it('hands typed sorting back unchanged, no sorting included', () => {
		expect(codec.parse([{ id: 'title', desc: true }])).toEqual([
			{ id: 'title', desc: true }
		]);
		expect(codec.parse([])).toEqual([]);
	});
});

describe('a table schema', () => {
	const schema = defineClassificationSearch({
		facets: ['state', 'category'],
		pageSize: 25,
		sort: [{ id: 'created', desc: true }]
	});

	it('lists its facets', () => {
		expect(schema.facets).toEqual(['state', 'category']);
	});

	describe('readTableSearch', () => {
		it('fills the table defaults for absent keys', () => {
			expect(readTableSearch(schema, {})).toEqual({
				page: 1,
				pageSize: 25,
				q: '',
				sort: [{ id: 'created', desc: true }],
				open: {},
				state: [],
				category: []
			});
		});

		it('reads wire strings and typed values alike, and only its own keys', () => {
			const wire = readTableSearch(schema, {
				page: '2',
				sort: 'title:asc',
				state: 'open;closed',
				_s: 'abc'
			});
			const typed = readTableSearch(schema, {
				page: 2,
				sort: [{ id: 'title', desc: false }],
				state: ['open', 'closed'],
				_s: 'abc'
			});

			expect(wire).toEqual(typed);
			expect(wire).toMatchObject({
				page: 2,
				sort: [{ id: 'title', desc: false }],
				state: ['open', 'closed']
			});
			expect(wire).not.toHaveProperty('_s');
		});

		it('reads garbage as the default', () => {
			expect(
				readTableSearch(schema, { page: '0', pageSize: '7', sort: ':asc' })
			).toMatchObject({
				page: 1,
				pageSize: 25,
				sort: [{ id: 'created', desc: true }]
			});
		});
	});

	describe('toTableWire', () => {
		it('writes a value that differs from the default as its wire string', () => {
			expect(
				toTableWire(schema, {
					page: 3,
					pageSize: 50,
					q: 'timeout',
					sort: [{ id: 'title', desc: false }],
					state: ['open', 'closed']
				})
			).toEqual({
				page: '3',
				pageSize: '50',
				q: 'timeout',
				sort: 'title:asc',
				state: 'open;closed'
			});
		});

		it('removes a key whose value is the default or empty', () => {
			expect(
				toTableWire(schema, {
					page: 1,
					pageSize: 25,
					q: '',
					sort: [{ id: 'created', desc: true }],
					open: {},
					state: []
				})
			).toEqual({
				page: undefined,
				pageSize: undefined,
				q: undefined,
				sort: undefined,
				open: undefined,
				state: undefined
			});
		});

		it('writes no sorting when the default sorts by a column', () => {
			expect(toTableWire(schema, { sort: [] })).toEqual({ sort: 'none' });
		});

		it('leaves keys the schema does not declare alone', () => {
			expect(toTableWire(schema, { mode: 'x' })).toEqual({});
		});
	});
});
