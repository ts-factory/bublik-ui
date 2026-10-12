/* SPDX-License-Identifier: MIT */
/* SPDX-FileCopyrightText: 2021 Tanner Linsley */
/**
 * The JSURL value parser of `react-location-jsurl` 3.3.3 (MIT, Tanner
 * Linsley; after Bruno Jouhier's jsurl), kept only so `convertOldUrlSearch`
 * can still read a legacy `~` link once the package is gone.
 * Strings take the `-` prefix (the older `'` too), so `~-1` is the string
 * `'1'`; a value that is not JSURL throws.
 */

const STRING_PREFIXES = ['-', "'"];

const KEYWORDS: Record<string, boolean | null> = {
	true: true,
	false: false,
	null: null
};

function parseJsurl(input: string): unknown {
	const s = input.replace(/%(25)*27/g, "'");
	const len = s.length;
	let i = 0;

	function eat(expected: string): void {
		if (s.charAt(i) !== expected) throw new Error('bad JSURL syntax');
		i++;
	}

	function decode(): string {
		let beg = i;
		let result = '';

		while (i < len && s.charAt(i) !== '~' && s.charAt(i) !== ')') {
			const ch = s.charAt(i);

			if (ch === '*') {
				if (beg < i) result += s.substring(beg, i);
				const width = s.charAt(i + 1) === '*' ? 4 : 2;
				const start = i + (width === 4 ? 2 : 1);
				result += String.fromCharCode(
					parseInt(s.substring(start, start + width), 16)
				);
				beg = i = start + width;
			} else if (ch === '!') {
				if (beg < i) result += s.substring(beg, i);
				result += '$';
				beg = ++i;
			} else {
				i++;
			}
		}

		return result + s.substring(beg, i);
	}

	function parseOne(): unknown {
		eat('~');
		const ch = s.charAt(i);

		if (ch === '(') {
			i++;
			let result: unknown;

			if (s.charAt(i) === '~') {
				const list: unknown[] = [];
				if (s.charAt(i + 1) === ')') i++;
				else {
					do list.push(parseOne());
					while (s.charAt(i) === '~');
				}
				result = list;
			} else {
				const object: Record<string, unknown> = {};
				if (s.charAt(i) !== ')') {
					do {
						const key = decode();
						object[key] = parseOne();
					} while (s.charAt(i) === '~' && ++i);
				}
				result = object;
			}

			eat(')');
			return result;
		}

		if (STRING_PREFIXES.includes(ch)) {
			i++;
			return decode();
		}

		const beg = i++;
		while (i < len && /[^)~]/.test(s.charAt(i))) i++;
		const word = s.substring(beg, i);

		if (/[\d-]/.test(ch)) return parseFloat(word);
		if (!(word in KEYWORDS)) throw new Error('bad JSURL keyword');

		return KEYWORDS[word];
	}

	if (!s) return s;

	return parseOne();
}

export { parseJsurl };
