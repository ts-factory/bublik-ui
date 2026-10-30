/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import {
	expressionAtoms,
	findValueOnlyAtom,
	formatExpression,
	isExpressionText,
	joinExpressions,
	matchExpressionSuggestion,
	normalizeExpression,
	splitExactValues,
	splitExpressions,
	validateExpression,
	wordAtCaret
} from './expression';

describe('isExpressionText', () => {
	it.each(['a & b', '!a', 'x>1', '(a)', 'a | b'])('is true for %s', (text) =>
		expect(isExpressionText(text)).toBe(true)
	);

	it.each(['medford', 'pci=15b3', 'pci: 15b3', 'payload_len=[0,1200]'])(
		'is false for %s',
		(text) => expect(isExpressionText(text)).toBe(false)
	);
});

describe('validateExpression', () => {
	// Everything the backend's `filter_expression.py` grammar accepts.
	it.each([
		'medford',
		'!medford',
		'!!medford',
		'a & b',
		'a | b',
		'a&b|c',
		'(a | b) & !c',
		'!(a & b)',
		'pci=15b3',
		'pci = 15b3',
		'pci: 15b3',
		'pci!=15b3',
		'pci != 15b3',
		'pkt_size > 100',
		'pkt_size>=1.5e3',
		'x<-3',
		'fixture_id=e2e:basic',
		'a.b_c-d/e%f+g',
		'TE_REV=8af3831+',
		'rev!=8af3831 | !dirty'
	])('accepts %s', (text) => {
		expect(validateExpression(text)).toBeNull();
	});

	it.each([
		['', 'Expression is empty', true],
		['a &', 'Expression ends with an operator', true],
		['(a', 'Unbalanced parenthesis: `(` is never closed', true],
		['pci=', '`=` needs a value on the right', true],
		['pkt >', '`>` needs a number on the right', true],
		['a)', 'Unbalanced parenthesis: `)` has no `(`', false],
		['()', 'Empty parentheses', false],
		['a b', 'A name cannot contain a space; join names with & or |', false],
		['pci=a b', 'A value cannot contain a space', false],
		['a: b c', 'A value cannot contain a space', false],
		['pci==1', '`==` is not an operator, use `=`', false],
		['"a"', 'Quotes are not allowed', false],
		['a & & b', '`&` needs a name before it', false],
		['pkt > big', '`>` needs a number on the right', false],
		['(a) b', 'Missing & or | before `b`', false],
		[
			'a=[1]',
			'`[` cannot be used in an expression, only in an exact value',
			false
		]
	])('refuses %s: %s', (text, message, tail) => {
		expect(validateExpression(text)).toMatchObject({ message, tail });
	});

	it('points at the offending span', () => {
		expect(validateExpression('medford & pkt > big')).toMatchObject({
			start: 16,
			end: 19
		});
	});
});

describe('normalizeExpression', () => {
	it.each([
		['a: b & c', 'a=b & c'],
		['a&b|c', 'a & b | c'],
		['a   =  b', 'a=b'],
		['!( a|b )', '!(a | b)'],
		['pkt>100', 'pkt > 100'],
		['pci != 15b3', 'pci!=15b3'],
		['fixture_id: e2e:basic', 'fixture_id=e2e:basic'],
		['  medford  ', 'medford'],
		// What the lexer cannot read is left as typed.
		['"broken', '"broken']
	])('turns %s into %s', (text, expected) => {
		expect(normalizeExpression(text)).toBe(expected);
	});
});

describe('formatExpression', () => {
	it('shows = as the badges do and leaves != alone', () => {
		expect(formatExpression('pci=15b3 & !x | a!=b')).toBe(
			'pci: 15b3 & !x | a!=b'
		);
	});
});

describe('joinExpressions', () => {
	it.each([
		[[], ''],
		[['a'], 'a'],
		[['a | b', 'c'], '(a | b) & c'],
		[['a: b', '', '  c  '], 'a=b & c'],
		[['!(a | b)', 'c'], '!(a | b) & c']
	])('joins %j into %s', (chips, expected) => {
		expect(joinExpressions(chips)).toBe(expected);
	});
});

describe('splitExpressions', () => {
	it.each([
		['', []],
		['a & b', ['a', 'b']],
		['(a | b) & c', ['a | b', 'c']],
		['(a & b)', ['a', 'b']],
		['((a | b) & c) & d', ['a | b', 'c', 'd']],
		['!(a & b)', ['!(a & b)']],
		['a | b & c', ['a | b & c']],
		['a: b & c>1', ['a=b', 'c > 1']],
		// A legacy link the lexer or the grammar refuses stays one chip.
		['"broken" & x', ['"broken" & x']],
		['a & & b', ['a & & b']]
	])('splits %s into %j', (text, expected) => {
		expect(splitExpressions(text)).toEqual(expected);
	});

	it('is the inverse of joinExpressions', () => {
		const chips = ['medford', 'pci-15b3 | pci-sub-15b3', '!(a & b)', 'c=1'];

		expect(splitExpressions(joinExpressions(chips))).toEqual(chips);
	});

	it('is idempotent', () => {
		const once = splitExpressions('(a & b) & (c | d)');

		expect(once.flatMap(splitExpressions)).toEqual(once);
	});
});

describe('wordAtCaret', () => {
	it.each([
		['medford & pci-s', 15, { start: 10, end: 15, query: 'pci-s' }],
		['medford & pci: 80', 17, { start: 10, end: 17, query: 'pci: 80' }],
		['a & pci!=15', 11, { start: 4, end: 11, query: 'pci!=15' }],
		['medford & ipv6', 3, { start: 0, end: 7, query: 'med' }],
		['a & ', 4, { start: 4, end: 4, query: '' }]
	])('finds the word in %s at %i', (text, caret, expected) => {
		expect(wordAtCaret(text, caret)).toEqual(expected);
	});
});

describe('matchExpressionSuggestion', () => {
	it.each([
		['pci=15b3', '', { ok: true, insert: 'pci: 15b3', prefix: true }],
		['pci=15b3', 'pci: 1', { ok: true, insert: 'pci: 15b3', prefix: true }],
		['pci=15b3', 'pci:', { ok: true, insert: 'pci: 15b3', prefix: true }],
		['pci=15b3', 'pci=5b', { ok: true, insert: 'pci: 15b3', prefix: false }],
		['pci=15b3', 'pci!=1', { ok: true, insert: 'pci!=15b3', prefix: true }],
		['pci=15b3', 'proto=', { ok: false, insert: 'pci: 15b3', prefix: false }],
		['pci-15b3', 'PCI', { ok: true, insert: 'pci-15b3', prefix: true }],
		['pci-15b3', '15b3', { ok: true, insert: 'pci-15b3', prefix: false }],
		['medford', 'x', { ok: false, insert: 'medford', prefix: false }]
	])('matches %s against %s', (entry, query, expected) => {
		expect(matchExpressionSuggestion(entry, query)).toEqual(expected);
	});
});

describe('splitExactValues', () => {
	it.each([
		['a=b & c=[0,1200]', ['a=b', 'c=[0,1200]']],
		['a: b & c', ['a=b', 'c']],
		['medford', ['medford']]
	])('reads %s as values', (text, expected) => {
		expect(splitExactValues(text)).toEqual(expected);
	});

	it.each(['a | b', 'a=b c', 'a &', '(a)', 'a==b', '!a & b', 'pkt > 1'])(
		'refuses %s',
		(text) => {
			expect(splitExactValues(text)).toBeNull();
		}
	);
});

describe('expressionAtoms', () => {
	it('lists each atom with its name and span', () => {
		expect(expressionAtoms('a & (b: 1 | !c!=2) & d > 3')).toEqual([
			{ name: 'a', atom: 'a', start: 0, end: 1 },
			{ name: 'b', atom: 'b=1', start: 5, end: 9 },
			{ name: 'c', atom: 'c!=2', start: 13, end: 17 },
			{ name: 'd', atom: 'd > 3', start: 21, end: 26 }
		]);
	});

	it('is empty for text the lexer cannot read', () => {
		expect(expressionAtoms('"a" & b')).toEqual([]);
	});
});

describe('findValueOnlyAtom', () => {
	const names = new Set(['branch', 'nightly']);

	it.each([
		['branch=main & medford', { atom: 'branch=main', start: 0, end: 11 }],
		['medford & branch != main', { atom: 'branch!=main', start: 10, end: 24 }],
		['nightly | a', { atom: 'nightly', start: 0, end: 7 }],
		['(a | branch: main)', { atom: 'branch=main', start: 5, end: 17 }]
	])('finds the atom in %s', (text, expected) => {
		expect(findValueOnlyAtom(text, names)).toEqual(expected);
	});

	it.each(['x=branch', 'a & b', '"a'])('finds nothing in %s', (text) => {
		expect(findValueOnlyAtom(text, names)).toBeNull();
	});

	it('finds nothing with no names', () => {
		expect(findValueOnlyAtom('branch=main', new Set())).toBeNull();
	});
});
