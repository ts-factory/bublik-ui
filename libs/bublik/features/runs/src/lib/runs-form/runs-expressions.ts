/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

/**
 * The kinds of meta an expression on the runs page can search. The backend
 * evaluates each `*_expr` parameter against one meta type, so an expression
 * chip is sent under the parameter of the kind of the metas it names.
 */
const RUN_EXPRESSION_KINDS = ['tag', 'label', 'branch', 'revision'] as const;

type RunExpressionKind = (typeof RUN_EXPRESSION_KINDS)[number];

type RunExpressionParam =
	| 'tagExpr'
	| 'labelExpr'
	| 'branchExpr'
	| 'revisionExpr';

/** The URL and form parameter that carries each kind's expression. */
const RUN_EXPRESSION_PARAM: Record<RunExpressionKind, RunExpressionParam> = {
	tag: 'tagExpr',
	label: 'labelExpr',
	branch: 'branchExpr',
	revision: 'revisionExpr'
};

const RUN_EXPRESSION_PARAMS = RUN_EXPRESSION_KINDS.map(
	(kind) => RUN_EXPRESSION_PARAM[kind]
);

/** What a chip whose metas no list knows is taken for: the kind the page always had. */
const DEFAULT_RUN_EXPRESSION_KIND: RunExpressionKind = 'tag';

type RunExpressions = Record<RunExpressionParam, string>;

const EMPTY_RUN_EXPRESSIONS: RunExpressions = {
	tagExpr: '',
	labelExpr: '',
	branchExpr: '',
	revisionExpr: ''
};

function isRunExpressionKind(kind: unknown): kind is RunExpressionKind {
	return RUN_EXPRESSION_KINDS.includes(kind as RunExpressionKind);
}

/** The expression of each kind the URL carries, `''` for none. */
function readRunExpressions(searchParams: URLSearchParams): RunExpressions {
	return Object.fromEntries(
		RUN_EXPRESSION_PARAMS.map((param) => [param, searchParams.get(param) ?? ''])
	) as RunExpressions;
}

/**
 * The set expressions of the URL, for the runs queries: an empty one is
 * left out, so the request only carries the expressions that filter.
 */
function queryRunExpressions(
	searchParams: URLSearchParams
): Partial<RunExpressions> {
	return Object.fromEntries(
		RUN_EXPRESSION_PARAMS.flatMap((param) => {
			const value = searchParams.get(param);
			return value ? [[param, value]] : [];
		})
	);
}

/** The expressions of a form, or of anything carrying the same fields. */
function pickRunExpressions(source: RunExpressions): RunExpressions {
	return Object.fromEntries(
		RUN_EXPRESSION_PARAMS.map((param) => [param, source[param] ?? ''])
	) as RunExpressions;
}

/** Sets each kind's parameter, or deletes it when the expression is empty. */
function writeRunExpressions(
	params: URLSearchParams,
	expressions: RunExpressions
): URLSearchParams {
	for (const param of RUN_EXPRESSION_PARAMS) {
		const value = expressions[param];
		value ? params.set(param, value) : params.delete(param);
	}
	return params;
}

function hasRunExpression(expressions: RunExpressions): boolean {
	return RUN_EXPRESSION_PARAMS.some((param) => expressions[param].trim());
}

export {
	RUN_EXPRESSION_KINDS,
	RUN_EXPRESSION_PARAM,
	RUN_EXPRESSION_PARAMS,
	DEFAULT_RUN_EXPRESSION_KIND,
	EMPTY_RUN_EXPRESSIONS,
	isRunExpressionKind,
	readRunExpressions,
	queryRunExpressions,
	pickRunExpressions,
	writeRunExpressions,
	hasRunExpression
};
export type { RunExpressionKind, RunExpressionParam, RunExpressions };
