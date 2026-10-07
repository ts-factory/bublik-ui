/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { describe, expect, it } from 'vitest';

import {
	formatParameterValue,
	isPreformattedParameterValue,
	parseParameter,
	toSingleLineParameterLabel
} from './parameter-format';

const TMPL_VALUE = `{
                  pdus {
                    eth:{
                      dst-addr env:{ name "env.addr.tst_lladdr" },
                      src-addr env:{ name "env.addr.iut_lladdr" },
                      length-type plain:8111
                    }
                  }
                }`;

describe('isPreformattedParameterValue', () => {
	it('should not treat a plain value as preformatted', () => {
		expect(isPreformattedParameterValue('1500')).toBe(false);
	});

	it('should not treat a dotted env reference as preformatted', () => {
		expect(isPreformattedParameterValue('VAR.env.peer2peer')).toBe(false);
	});

	it('should treat a long single-line braced value as preformatted', () => {
		expect(
			isPreformattedParameterValue('{ addr 10.0.0.1, port 8080, proto tcp }')
		).toBe(true);
	});

	it('should keep short braced values inline', () => {
		expect(isPreformattedParameterValue('a{3}')).toBe(false);
		expect(isPreformattedParameterValue('${HOST}')).toBe(false);
		expect(isPreformattedParameterValue('{}')).toBe(false);
		expect(isPreformattedParameterValue('{ a 1, b 2 }')).toBe(false);
	});

	it('should not treat a long value with an unclosed brace as preformatted', () => {
		expect(
			isPreformattedParameterValue('a very long value with a lone { brace')
		).toBe(false);
	});

	it('should treat a multiline value as preformatted', () => {
		expect(isPreformattedParameterValue('line one\nline two')).toBe(true);
	});
});

describe('formatParameterValue', () => {
	it('should leave a plain value untouched', () => {
		expect(formatParameterValue('1500')).toBe('1500');
	});

	it('should indent a single-line braced value', () => {
		expect(formatParameterValue('{ a 1, b 2 }')).toBe(
			['{', '   a 1,', '   b 2 ', '}'].join('\n')
		);
	});

	it('should not reindent a value detected as a code block', () => {
		const code = ['# comment', 'do (foo);', 'if (bar) {', '}'].join('\n');

		expect(formatParameterValue(code)).toBe(code);
	});

	it('should reindent a multiline structure that is not code', () => {
		const value = ['root {', 'child {', 'leaf', '}', '}'].join('\n');

		expect(formatParameterValue(value)).toBe(
			['root {', '  child {', '    leaf', '  }', '}'].join('\n')
		);
	});

	it('should keep the tmpl sample readable', () => {
		const formatted = formatParameterValue(TMPL_VALUE);

		expect(formatted.split('\n')[0]).toBe('{');
		expect(formatted).toContain('length-type plain:8111');
	});
});

describe('parseParameter', () => {
	it('should split a plain parameter', () => {
		expect(parseParameter('time_limit=30')).toEqual({
			name: 'time_limit',
			value: '30',
			isPreformatted: false
		});
	});

	it('should treat a value-less parameter as an empty value', () => {
		expect(parseParameter('linux-mm-612')).toEqual({
			name: 'linux-mm-612',
			value: '',
			isPreformatted: false
		});
	});

	it('should split only on the first delimiter', () => {
		expect(parseParameter('env=VAR.env.peer2peer').value).toBe(
			'VAR.env.peer2peer'
		);
	});

	it('should flag a preformatted parameter', () => {
		expect(parseParameter(`tmpl=${TMPL_VALUE}`)).toEqual({
			name: 'tmpl',
			value: TMPL_VALUE,
			isPreformatted: true
		});
	});

	it('should respect a custom submit delimiter', () => {
		expect(parseParameter('mtu:1500', ':')).toMatchObject({
			name: 'mtu',
			value: '1500'
		});
	});
});

describe('toSingleLineParameterLabel', () => {
	it('should leave a short single-line label untouched', () => {
		expect(toSingleLineParameterLabel('mtu: 1500')).toBe('mtu: 1500');
	});

	it('should collapse a multiline value onto one line', () => {
		expect(
			toSingleLineParameterLabel('tmpl: {\n  pdus {\n    eth\n  }\n}')
		).toBe('tmpl: { pdus { eth } }');
	});

	it('should truncate a long label with an ellipsis', () => {
		const label = toSingleLineParameterLabel(`tmpl: ${TMPL_VALUE}`, 20);

		expect(label).toHaveLength(20);
		expect(label.endsWith('…')).toBe(true);
	});
});
