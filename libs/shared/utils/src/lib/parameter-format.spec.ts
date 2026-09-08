/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { describe, expect, it } from 'vitest';

import {
	formatParameterValue,
	isPreformattedParameterValue,
	parseParameter
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

	it('should treat a single-line braced value as preformatted', () => {
		expect(isPreformattedParameterValue('{ a 1, b 2 }')).toBe(true);
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
			isPreformatted: false,
			formattedValue: '30'
		});
	});

	it('should treat a value-less parameter as an empty value', () => {
		expect(parseParameter('linux-mm-612')).toEqual({
			name: 'linux-mm-612',
			value: '',
			isPreformatted: false,
			formattedValue: ''
		});
	});

	it('should split only on the first delimiter', () => {
		expect(parseParameter('env=VAR.env.peer2peer').value).toBe(
			'VAR.env.peer2peer'
		);
	});

	it('should format a preformatted parameter', () => {
		const parsed = parseParameter(`tmpl=${TMPL_VALUE}`);

		expect(parsed.name).toBe('tmpl');
		expect(parsed.isPreformatted).toBe(true);
		expect(parsed.formattedValue).toBe(formatParameterValue(TMPL_VALUE));
	});

	it('should respect a custom submit delimiter', () => {
		expect(parseParameter('mtu:1500', ':')).toMatchObject({
			name: 'mtu',
			value: '1500'
		});
	});
});
