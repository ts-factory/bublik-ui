/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

/**
 * The backend's meta expression grammar, mirrored on the client so that an
 * expression is refused here, with a reason, instead of as an HTTP 500.
 *
 * An expression is atoms joined by `!`, `&`, `|` and parentheses. An atom is
 * `name`, `name=value`, `name!=value`, or `name <op> number` with `<`, `<=`,
 * `>`, `>=`. Names and values are one run of letters, digits and
 * `. _ - / % + :`; whitespace is allowed around operators, `=` and `!=`
 * included, and nowhere else.
 * See the backend's `doc/wiki/expression_filters.md`.
 *
 * The UI shows a key and value as `name: value` everywhere, so expressions
 * are shown that way too and `name: value` is read as `name=value`: a `:`
 * that ends a name and is followed by a space. A `:` inside a word, as in
 * `fixture_id=e2e:basic`, stays part of the word. What is stored and sent is
 * always the `=` form.
 */

/** How `=` is shown in an expression, matching the key/value badges. */
const DISPLAY_EQUALS = ': ';

const NAME_CHAR = /[A-Za-z0-9._\-/%+:]/;
const NUMBER = /^[+-]?\d+(\.\d*)?([eE][+-]?\d+)?$/;
const OPERATOR_CHARS = /[&|!()<>]/;

type TokenType = 'id' | 'eq' | 'cmp' | '&' | '|' | '!' | '(' | ')';

interface Token {
	type: TokenType;
	value: string;
	start: number;
	end: number;
}

interface ExpressionError {
	message: string;
	/** The offending span of the text. */
	start: number;
	end: number;
	/**
	 * The text is merely unfinished (ends with an operator, `(` not yet
	 * closed): normal mid-typing, an error only once the user commits.
	 */
	tail: boolean;
}

type LexResult =
	| { tokens: Token[]; error?: never }
	| { error: ExpressionError };

/** Whether what is typed can only be an expression, not an exact value. */
function isExpressionText(text: string): boolean {
	return OPERATOR_CHARS.test(text);
}

function lexExpression(text: string): LexResult {
	const tokens: Token[] = [];
	let i = 0;

	const fail = (message: string, start: number, end: number): LexResult => ({
		error: { message, start, end, tail: false }
	});

	while (i < text.length) {
		const c = text[i];
		const d = text[i + 1];

		if (c === ' ' || c === '\t') {
			i += 1;
			continue;
		}
		if (c === '"' || c === "'") return fail('Quotes are not allowed', i, i + 1);
		if (NAME_CHAR.test(c)) {
			let j = i;
			while (j < text.length && NAME_CHAR.test(text[j])) j += 1;

			// `name: value`, the shown form of `name=value`. Before an operator
			// or a `)` the `:` is left in the name, as the backend would read it.
			let k = j;
			while (k < text.length && (text[k] === ' ' || text[k] === '\t')) k += 1;
			const isShownEquals =
				j - i > 1 &&
				text[j - 1] === ':' &&
				k > j &&
				(k === text.length || NAME_CHAR.test(text[k]));

			if (isShownEquals) {
				tokens.push({
					type: 'id',
					value: text.slice(i, j - 1),
					start: i,
					end: j - 1
				});
				tokens.push({ type: 'eq', value: '=', start: j - 1, end: k });
				i = k;
				continue;
			}

			tokens.push({ type: 'id', value: text.slice(i, j), start: i, end: j });
			i = j;
			continue;
		}
		if (c === '=' && d === '=') {
			return fail('`==` is not an operator, use `=`', i, i + 2);
		}
		if (c === '!' && d === '=') {
			tokens.push({ type: 'eq', value: '!=', start: i, end: i + 2 });
			i += 2;
			continue;
		}
		if ((c === '<' || c === '>') && d === '=') {
			tokens.push({ type: 'cmp', value: `${c}=`, start: i, end: i + 2 });
			i += 2;
			continue;
		}
		if (c === '<' || c === '>') {
			tokens.push({ type: 'cmp', value: c, start: i, end: i + 1 });
			i += 1;
			continue;
		}
		if (c === '=') {
			tokens.push({ type: 'eq', value: '=', start: i, end: i + 1 });
			i += 1;
			continue;
		}
		if (c === '&' || c === '|' || c === '!' || c === '(' || c === ')') {
			tokens.push({ type: c, value: c, start: i, end: i + 1 });
			i += 1;
			continue;
		}

		return fail(
			`\`${c}\` cannot be used in an expression, only in an exact value`,
			i,
			i + 1
		);
	}

	return { tokens };
}

class ValidationFailure extends Error {
	constructor(public readonly detail: ExpressionError) {
		super(detail.message);
	}
}

/**
 * The first thing wrong with an expression, or `null` when the backend
 * would parse it.
 */
function validateExpression(text: string): ExpressionError | null {
	if (!text.trim()) {
		return { message: 'Expression is empty', start: 0, end: 0, tail: true };
	}

	const lexed = lexExpression(text);
	if (lexed.error) return lexed.error;

	const tokens = lexed.tokens;
	let position = 0;
	// What the user typed for a token: `:` for the shown form of `=`.
	const typed = (token: Token) => text.slice(token.start, token.end).trim();

	const fail = (
		message: string,
		start: number,
		end: number,
		tail = false
	): never => {
		throw new ValidationFailure({ message, start, end, tail });
	};

	const atom = () => {
		const name = tokens[position];
		position += 1;
		const next = tokens[position];

		if (next?.type === 'eq') {
			position += 1;
			const value = tokens[position];
			if (!value) {
				fail(
					`\`${typed(next)}\` needs a value on the right`,
					next.start,
					next.end,
					true
				);
			}
			if (value.type !== 'id') {
				fail(
					`\`${typed(next)}\` needs a value on the right`,
					next.start,
					next.end
				);
			}
			position += 1;
			const after = tokens[position];
			if (after?.type === 'id') {
				fail('A value cannot contain a space', value.start, after.end);
			}
			return;
		}

		if (next?.type === 'cmp') {
			position += 1;
			const value = tokens[position];
			if (!value) {
				fail(
					`\`${next.value}\` needs a number on the right`,
					next.start,
					next.end,
					true
				);
			}
			if (value.type !== 'id' || !NUMBER.test(value.value)) {
				fail(
					`\`${next.value}\` needs a number on the right`,
					value.type === 'id' ? value.start : next.start,
					value.type === 'id' ? value.end : next.end
				);
			}
			position += 1;
			const after = tokens[position];
			if (after?.type === 'id') {
				fail('A value cannot contain a space', value.start, after.end);
			}
			return;
		}

		if (next?.type === 'id') {
			fail(
				'A name cannot contain a space; join names with & or |',
				name.start,
				next.end
			);
		}
	};

	const primary = () => {
		const token = tokens[position];

		if (!token) {
			const last = tokens[tokens.length - 1];
			fail('Expression ends with an operator', last.start, last.end, true);
		}
		if (token.type === '(') {
			position += 1;
			if (tokens[position]?.type === ')') {
				fail('Empty parentheses', token.start, tokens[position].end);
			}
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			orExpression();
			const closing = tokens[position];
			if (!closing) {
				fail(
					'Unbalanced parenthesis: `(` is never closed',
					token.start,
					token.end,
					true
				);
			}
			if (closing.type !== ')') {
				fail(
					`Missing & or | before \`${closing.value}\``,
					closing.start,
					closing.end
				);
			}
			position += 1;
			return;
		}
		if (token.type === 'id') {
			atom();
			return;
		}
		if (token.type === ')') {
			fail('Unbalanced parenthesis: `)` has no `(`', token.start, token.end);
		}

		fail(`\`${token.value}\` needs a name before it`, token.start, token.end);
	};

	const notExpression = () => {
		if (tokens[position]?.type === '!') {
			position += 1;
			notExpression();
			return;
		}
		primary();
	};

	const andExpression = () => {
		notExpression();
		while (tokens[position]?.type === '&') {
			position += 1;
			notExpression();
		}
	};

	const orExpression = () => {
		andExpression();
		while (tokens[position]?.type === '|') {
			position += 1;
			andExpression();
		}
	};

	try {
		orExpression();
		if (position < tokens.length) {
			const token = tokens[position];
			if (token.type === ')') {
				fail('Unbalanced parenthesis: `)` has no `(`', token.start, token.end);
			}
			fail(`Missing & or | before \`${token.value}\``, token.start, token.end);
		}
		return null;
	} catch (error) {
		if (error instanceof ValidationFailure) return error.detail;
		throw error;
	}
}

function printTokens(tokens: Token[], equals: string): string {
	return tokens
		.map((token) => {
			if (token.type === '&' || token.type === '|' || token.type === 'cmp') {
				return ` ${token.value} `;
			}
			if (token.type === 'eq' && token.value === '=') return equals;
			return token.value;
		})
		.join('')
		.trim();
}

/**
 * The expression as it is stored and sent: `=` between a name and a value,
 * one space around `&`, `|` and comparisons, none elsewhere.
 */
function normalizeExpression(text: string): string {
	const lexed = lexExpression(text);
	if (lexed.error) return text.trim();

	return printTokens(lexed.tokens, '=');
}

/** The expression as the UI shows it: `name: value`, as the badges are. */
function formatExpression(text: string): string {
	const lexed = lexExpression(text);
	if (lexed.error) return text.trim();

	return printTokens(lexed.tokens, DISPLAY_EQUALS);
}

/** A `name=value` suggestion as the UI shows it. */
function formatPair(entry: string): string {
	const separator = entry.indexOf('=');
	if (separator < 0) return entry;

	return `${entry.slice(0, separator)}${DISPLAY_EQUALS}${entry.slice(
		separator + 1
	)}`;
}

function hasTopLevelOr(text: string): boolean {
	const lexed = lexExpression(text);
	if (lexed.error) return false;

	let depth = 0;
	for (const token of lexed.tokens) {
		if (token.type === '(') depth += 1;
		else if (token.type === ')') depth -= 1;
		else if (token.type === '|' && depth === 0) return true;
	}
	return false;
}

/** Whether the text is one `( … )` group, so the parentheses can be dropped. */
function isWrappedInParentheses(tokens: Token[]): boolean {
	if (tokens.length < 2) return false;
	if (tokens[0].type !== '(' || tokens[tokens.length - 1].type !== ')') {
		return false;
	}

	let depth = 0;
	for (let index = 0; index < tokens.length; index += 1) {
		if (tokens[index].type === '(') depth += 1;
		else if (tokens[index].type === ')') depth -= 1;
		if (depth === 0 && index < tokens.length - 1) return false;
	}
	return depth === 0;
}

/**
 * Joins expression chips into the one string a `*_expr` parameter carries:
 * ANDed, a chip with a top-level `|` wrapped in parentheses so the `&` binds
 * to all of it.
 */
function joinExpressions(expressions: readonly string[]): string {
	const normalized = expressions
		.map(normalizeExpression)
		.filter((expression) => expression.length > 0);

	if (normalized.length <= 1) return normalized[0] ?? '';

	return normalized
		.map((expression) =>
			hasTopLevelOr(expression) ? `(${expression})` : expression
		)
		.join(' & ');
}

/**
 * Splits an expression into chips on its top-level `&`, the inverse of
 * `joinExpressions`: what a `*_expr` parameter carries, and what Enter adds,
 * so a chip never holds a top-level `&` and the chips are the same before
 * and after a reload. A part that is one `( … )` group loses the brackets
 * and is split again. Text the lexer cannot read (a legacy link) stays one
 * chip, so nothing is lost.
 */
function splitExpressions(text: string): string[] {
	const trimmed = text.trim();
	if (!trimmed) return [];

	const lexed = lexExpression(trimmed);
	if (lexed.error || validateExpression(trimmed)) return [trimmed];

	const tokens = lexed.tokens;
	if (isWrappedInParentheses(tokens)) {
		const inner = tokens.slice(1, -1);
		return splitExpressions(
			trimmed.slice(inner[0].start, inner[inner.length - 1].end)
		);
	}
	// `&` binds tighter than `|`: `a | b & c` is one OR, not `a | b` and `c`.
	if (hasTopLevelOr(trimmed)) return [normalizeExpression(trimmed)];

	const parts: Token[][] = [[]];
	let depth = 0;
	for (const token of tokens) {
		if (token.type === '(') depth += 1;
		else if (token.type === ')') depth -= 1;

		if (token.type === '&' && depth === 0) {
			parts.push([]);
			continue;
		}
		parts[parts.length - 1].push(token);
	}

	if (parts.length === 1) return [normalizeExpression(trimmed)];

	return parts.flatMap((part) =>
		splitExpressions(trimmed.slice(part[0].start, part[part.length - 1].end))
	);
}

/** `not` is a negation: a `!`, or the brackets of a group it negates. */
type SegmentKind = 'plain' | 'op' | 'not' | 'cmp' | 'quote';

interface ExpressionSegment {
	text: string;
	kind: SegmentKind;
	/** Inside the span an error points at. */
	error?: boolean;
	/** Inside the span an unfinished-expression hint points at. */
	hint?: boolean;
	/** Inside the word under the caret, the one the list completes. */
	token?: boolean;
}

interface SegmentOptions {
	error?: ExpressionError | null;
	token?: { start: number; end: number } | null;
}

/** The text cut into runs of one colour, for the highlighted mirror and the chips. */
/** Where the brackets of each `!( … )` group are, matched as typed. */
function findNegatedBrackets(text: string): Set<number> {
	const negated = new Set<number>();
	const open: { index: number; isNegated: boolean }[] = [];

	for (let index = 0; index < text.length; index += 1) {
		const char = text[index];
		if (char === '(') {
			const before = text.slice(0, index).trimEnd();
			const isNegated = before.endsWith('!');
			open.push({ index, isNegated });
			if (isNegated) negated.add(index);
		} else if (char === ')') {
			const group = open.pop();
			if (group?.isNegated) negated.add(index);
		}
	}

	return negated;
}

function segmentExpression(
	text: string,
	{ error, token }: SegmentOptions = {}
): ExpressionSegment[] {
	const segments: ExpressionSegment[] = [];
	let current: ExpressionSegment | null = null;
	const negatedBrackets = findNegatedBrackets(text);

	for (let index = 0; index < text.length; index += 1) {
		const char = text[index];
		let kind: SegmentKind = 'plain';

		if (char === '!' && text[index + 1] === '=') kind = 'cmp';
		else if (char === '=' && text[index - 1] === '!') kind = 'cmp';
		else if (char === '!' || negatedBrackets.has(index)) kind = 'not';
		else if ('&|()'.includes(char)) kind = 'op';
		else if ('=<>'.includes(char)) kind = 'cmp';
		else if (
			char === ':' &&
			text[index + 1] === ' ' &&
			NAME_CHAR.test(text[index - 1] ?? '')
		) {
			kind = 'cmp';
		} else if (char === '"' || char === "'") kind = 'quote';

		const inError = Boolean(
			error &&
				index >= error.start &&
				index < Math.max(error.end, error.start + 1)
		);
		const segment: ExpressionSegment = {
			text: char,
			kind,
			error: inError && !error?.tail,
			hint: inError && error?.tail,
			token: Boolean(
				!inError && token && index >= token.start && index < token.end
			)
		};

		if (
			current &&
			current.kind === segment.kind &&
			current.error === segment.error &&
			current.hint === segment.hint &&
			current.token === segment.token
		) {
			current.text += char;
		} else {
			current = segment;
			segments.push(segment);
		}
	}

	return segments;
}

const WORD_CHAR = /[A-Za-z0-9._\-/%+:=]/;

/** A name and the `: ` after it, ending at the caret's word. */
const SHOWN_NAME_BEFORE = /[A-Za-z0-9._\-/%+:]+:[ \t]+$/;

/**
 * The word the caret is in, `name`, `name=val`, `name: val` or `name!=val`
 * so far, which the list completes and a pick replaces.
 */
function wordAtCaret(
	text: string,
	caret: number
): { start: number; end: number; query: string } {
	let start = caret;
	let end = caret;

	while (start > 0) {
		const char = text[start - 1];
		if (WORD_CHAR.test(char)) start -= 1;
		else if (char === '!' && text[start] === '=') start -= 1;
		else break;
	}
	while (end < text.length && WORD_CHAR.test(text[end])) end += 1;

	const shownName = text.slice(0, start).match(SHOWN_NAME_BEFORE);
	if (shownName) start -= shownName[0].length;

	return { start, end, query: text.slice(start, caret) };
}

/**
 * Whether a suggestion (`name` or `name=value`) completes the word being
 * typed, and the text to insert for it, in the shown form: `pci: 1` and
 * `pci=1` find `pci=15b3` and insert `pci: 15b3`; `pci!=1` inserts
 * `pci!=15b3`. `prefix`: the query starts the suggestion (or its value),
 * not merely occurs in it, so the list can show those first.
 */
function matchExpressionSuggestion(
	entry: string,
	query: string
): { ok: boolean; insert: string; prefix: boolean } {
	const shown = formatPair(entry);
	if (!query) return { ok: true, insert: shown, prefix: true };

	const lowerQuery = query
		.toLowerCase()
		.replace(/:[ \t]+/, '=')
		// `pci:` is on its way to `pci: `, so it already asks for values.
		.replace(/^([^=!:]+):$/, '$1=');
	const keyValue = lowerQuery.match(/^([^=!]*)(!?=)(.*)$/);

	if (keyValue) {
		const separator = entry.indexOf('=');
		if (separator >= 0) {
			const name = entry.slice(0, separator).toLowerCase();
			const value = entry.slice(separator + 1).toLowerCase();
			if (name.startsWith(keyValue[1]) && value.includes(keyValue[3])) {
				const equals = keyValue[2] === '=' ? DISPLAY_EQUALS : '!=';
				return {
					ok: true,
					insert: `${entry.slice(0, separator)}${equals}${entry.slice(
						separator + 1
					)}`,
					prefix: value.startsWith(keyValue[3])
				};
			}
		}
	}

	const lowerEntry = entry.toLowerCase();
	const lowerPlain = query.toLowerCase();
	return {
		ok: lowerEntry.includes(lowerPlain),
		insert: shown,
		prefix: lowerEntry.startsWith(lowerPlain)
	};
}

/**
 * A value an exact value chip can carry, `name` or `name=value`: any
 * characters but spaces, quotes and the operators, so also the ones the
 * grammar cannot spell.
 */
const EXACT_VALUE = /^[^\s&|!()<>="']+(=[^\s&|!()<>="']+)?$/;

/**
 * The values of a text that is nothing but such values joined with `&`, or
 * `null`. ANDed exact values mean what value chips mean, and value chips are
 * not parsed by the backend's expression grammar, so a value it cannot
 * spell, as `payload_len=[0,1200]`, or a meta its expression parameter does
 * not search, can still be filtered on.
 */
function splitExactValues(text: string): string[] | null {
	const values = text
		.split('&')
		.map((part) => part.trim().replace(/:[ \t]+/, '='));

	return values.every((value) => EXACT_VALUE.test(value)) ? values : null;
}

interface ExpressionAtom {
	/** The meta name the atom tests. */
	name: string;
	/** The whole atom, `name`, `name=value`, `name!=value` or `name <op> number`, in the stored form. */
	atom: string;
	start: number;
	end: number;
}

/**
 * The atoms of an expression, in order, with their spans in the text. Empty
 * when the lexer cannot read it; the grammar is not checked.
 */
function expressionAtoms(text: string): ExpressionAtom[] {
	const lexed = lexExpression(text);
	if (lexed.error) return [];

	const tokens = lexed.tokens;
	const atoms: ExpressionAtom[] = [];
	for (let index = 0; index < tokens.length; index += 1) {
		const name = tokens[index];
		const before = tokens[index - 1];
		if (name.type !== 'id') continue;
		if (before?.type === 'eq' || before?.type === 'cmp') continue;

		const operator = tokens[index + 1];
		const value = tokens[index + 2];
		const end =
			(operator?.type === 'eq' || operator?.type === 'cmp') &&
			value?.type === 'id'
				? value.end
				: name.end;

		atoms.push({
			name: name.value,
			atom: normalizeExpression(text.slice(name.start, end)),
			start: name.start,
			end
		});
	}

	return atoms;
}

/**
 * The first atom whose name is one of `names`, the metas a field offers as
 * values only, with its span.
 */
function findValueOnlyAtom(
	text: string,
	names: ReadonlySet<string>
): { atom: string; start: number; end: number } | null {
	if (!names.size) return null;

	const found = expressionAtoms(text).find((atom) => names.has(atom.name));
	return found
		? { atom: found.atom, start: found.start, end: found.end }
		: null;
}

export {
	DISPLAY_EQUALS,
	formatExpression,
	splitExactValues,
	expressionAtoms,
	findValueOnlyAtom,
	isExpressionText,
	validateExpression,
	normalizeExpression,
	hasTopLevelOr,
	joinExpressions,
	splitExpressions,
	segmentExpression,
	wordAtCaret,
	matchExpressionSuggestion
};
export type { ExpressionAtom, ExpressionError, ExpressionSegment };
