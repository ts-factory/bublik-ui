/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/**
 * `node --test tools/check-typed-links.spec.cjs`: the typed-link gate over
 * fixture sources compiled in memory, where `Link`'s `to` is a union of
 * route paths (as the registered route tree types it) and `RouterLink`'s
 * is a plain string.
 */
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const ts = require('typescript');

const { findUntypedLinks } = require('./check-typed-links.cjs');

const PRELUDE = `
type RoutePath = '/runs' | '/runs/$runId' | '/history' | '/dashboard';
declare function Link(props: { to: RoutePath; params?: object; children?: unknown }): unknown;
declare function LinkWithProject(props: { to: RoutePath; children?: unknown }): unknown;
declare function RouterLink(props: { to: string; children?: unknown }): unknown;
declare function linkOptions<T extends { to: RoutePath }>(options: T): T;
declare function useNavigate(): (options: { to: RoutePath }) => void;
declare function useRouterNavigate(): (to: string | { pathname?: string }) => void;
declare const router: { navigate(options: { to: string }): void };
declare const typedRouter: { navigate(options: { to: RoutePath }): void };
declare namespace JSX {
	interface IntrinsicElements { a: { href?: string; children?: unknown } }
	interface Element {}
}
`;

/** The untyped links the gate finds in `body`, as their source text. */
function check(body) {
	const fileName = '/virtual/fixture.tsx';
	const source = `${PRELUDE}\n${body}`;
	const options = {
		jsx: ts.JsxEmit.Preserve,
		strict: true,
		noEmit: true,
		target: ts.ScriptTarget.ES2020,
		lib: ['lib.es2020.d.ts']
	};
	const host = ts.createCompilerHost(options);
	const getSourceFile = host.getSourceFile;
	host.getSourceFile = (name, version) =>
		name === fileName
			? ts.createSourceFile(name, source, version, true, ts.ScriptKind.TSX)
			: getSourceFile(name, version);
	host.fileExists = (name) => name === fileName || ts.sys.fileExists(name);
	host.readFile = (name) =>
		name === fileName ? source : ts.sys.readFile(name);

	const program = ts.createProgram([fileName], options, host);

	return findUntypedLinks(program, (name) => name === fileName).map(
		(finding) => finding.text
	);
}

describe('typed links pass', () => {
	for (const [name, body] of [
		[
			'a typed Link',
			`const a = <Link to="/runs/$runId" params={{ runId: 1 }} />;`
		],
		[
			'a typed link by any JSX name',
			`const a = <LinkWithProject to="/history" />;`
		],
		['linkOptions', `const to = linkOptions({ to: '/dashboard' }).to;`],
		['a typed navigate', `useNavigate()({ to: '/runs' });`],
		['a typed router.navigate', `typedRouter.navigate({ to: '/runs' });`],
		['an external link', `const a = <a href="https://example.com">x</a>;`],
		['a protocol-relative link', `const a = <a href="//example.com">x</a>;`],
		['a path that is not a link target', `const url = '/api/v2/runs';`]
	]) {
		it(name, () => assert.deepEqual(check(body), []));
	}
});

describe('untyped internal links fail, whatever the component is called', () => {
	for (const [name, body, found] of [
		[
			'a string to of a runtime link',
			`const a = <RouterLink to="/runs" />;`,
			`"/runs"`
		],
		['an href', `const a = <a href="/v2/runs">x</a>;`, `"/v2/runs"`],
		[
			'a template to',
			'declare const id: number;\nconst a = <RouterLink to={`/runs/${id}`} />;',
			'`/runs/${id}`'
		],
		[
			'an untyped navigate',
			`const navigate = useRouterNavigate();\nnavigate('/history');`,
			`'/history'`
		],
		[
			'a fallback inside a navigate argument',
			`declare const last: string;\nconst navigateTo = useRouterNavigate();\nnavigateTo(last || '/runs');`,
			`'/runs'`
		],
		[
			'router.navigate on an untyped router',
			`router.navigate({ to: '/runs' });`,
			`'/runs'`
		],
		[
			'a template inside an object',
			'declare const id: number;\nconst target = { to: `/runs/${id}` };',
			'`/runs/${id}`'
		],
		[
			'a pathname inside an object',
			`const navigate = useRouterNavigate();\nnavigate({ pathname: '/history' });`,
			`'/history'`
		]
	]) {
		it(name, () => assert.deepEqual(check(body), [found]));
	}
});
