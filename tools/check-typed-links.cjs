/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/**
 * The typed-link gate: an internal
 * link is checked against the route tree, never written as a string. Fails
 * on a string or template starting with `/` (not `//`) that is a link
 * target, wherever it is:
 *
 * - the `to` or `href` of any JSX element;
 * - a `to`, `href` or `pathname` property of any object;
 * - the first argument of a call whose callee is named `navigate…`
 *   (`navigate('/x')`, `router.navigate({ to: '/x' })`);
 *
 * passed through parentheses, `?:`, `||`, `??`, `as` and `!` included,
 * unless the type it lands in is a set of route paths: a typed TanStack
 * `Link`/`Navigate`/`navigate`/`redirect`/`linkOptions`, or the typed
 * `LinkWithProject`/`useNavigateWithProject`. A `string`-typed target
 * (`RouterLink`, `RouterLinkWithProject`, `useRouterNavigateWithProject`,
 * an untyped router, a plain object) fails: build its path with
 * `linkOptions({ to }).to` or make the link typed.
 *
 * Types come from the app's program (`apps/bublik/tsconfig.app.json`): the
 * route tree is registered there, so a lib's typed link is typed only when
 * compiled with the app (AGENTS.md, Module Boundaries). Specs, e2e and
 * test helpers are not checked.
 */
const path = require('path');
const ts = require('typescript');

const REPO_ROOT = path.resolve(__dirname, '..');
const APP_TSCONFIG = path.join(REPO_ROOT, 'apps/bublik/tsconfig.app.json');

const TARGET_PROPERTIES = new Set(['to', 'href', 'pathname']);

const PASS_THROUGH_OPERATORS = new Set([
	ts.SyntaxKind.BarBarToken,
	ts.SyntaxKind.QuestionQuestionToken
]);

/** The text a link literal starts with: a string, or a template's head. */
function leadingText(node) {
	if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
		return node.text;
	}
	if (ts.isTemplateExpression(node)) return node.head.text;

	return null;
}

const isInternalPath = (text) =>
	text !== null && text.startsWith('/') && !text.startsWith('//');

/** The value `node` hands on unchanged: what it is wrapped in, outermost. */
function outermostValue(node) {
	let value = node;

	for (;;) {
		const parent = value.parent;
		const passesThrough =
			ts.isParenthesizedExpression(parent) ||
			ts.isAsExpression(parent) ||
			ts.isNonNullExpression(parent) ||
			(ts.isSatisfiesExpression && ts.isSatisfiesExpression(parent)) ||
			ts.isJsxExpression(parent) ||
			(ts.isConditionalExpression(parent) && parent.condition !== value) ||
			(ts.isBinaryExpression(parent) &&
				PASS_THROUGH_OPERATORS.has(parent.operatorToken.kind));

		if (!passesThrough) return value;
		value = parent;
	}
}

function propertyName(name) {
	return ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : null;
}

function calleeName(expression) {
	if (ts.isIdentifier(expression)) return expression.text;
	if (ts.isPropertyAccessExpression(expression)) return expression.name.text;

	return null;
}

/** Whether the value lands where a link target goes. */
function isLinkTarget(value) {
	const parent = value.parent;

	if (ts.isJsxAttribute(parent)) {
		const name = parent.name.getText();
		return name === 'to' || name === 'href';
	}
	if (ts.isPropertyAssignment(parent) && parent.initializer === value) {
		return TARGET_PROPERTIES.has(propertyName(parent.name));
	}
	if (ts.isCallExpression(parent) && parent.arguments[0] === value) {
		return /^navigate/i.test(calleeName(parent.expression) ?? '');
	}

	return false;
}

/**
 * Whether the type a link lands in is a set of route paths: no part of it
 * is the plain `string` type (a missing contextual type is a plain object's
 * property, untyped too).
 */
function isTypedTarget(checker, node) {
	const type = checker.getContextualType(node);
	if (!type) return false;

	const parts = type.isUnion() ? type.types : [type];

	return parts.every(
		(part) =>
			!(
				part.flags &
				(ts.TypeFlags.String | ts.TypeFlags.Any | ts.TypeFlags.Unknown)
			)
	);
}

/**
 * The untyped internal links in the program's files that `isChecked` keeps:
 * `{ fileName, line, column, text }`, line and column 1-based.
 */
function findUntypedLinks(program, isChecked) {
	const checker = program.getTypeChecker();
	const findings = [];

	for (const sourceFile of program.getSourceFiles()) {
		if (sourceFile.isDeclarationFile || !isChecked(sourceFile.fileName)) {
			continue;
		}

		const visit = (node) => {
			if (
				isInternalPath(leadingText(node)) &&
				isLinkTarget(outermostValue(node)) &&
				!isTypedTarget(checker, node)
			) {
				const { line, character } = sourceFile.getLineAndCharacterOfPosition(
					node.getStart(sourceFile)
				);

				findings.push({
					fileName: sourceFile.fileName,
					line: line + 1,
					column: character + 1,
					text: node.getText(sourceFile)
				});
			}

			ts.forEachChild(node, visit);
		};

		visit(sourceFile);
	}

	return findings;
}

/** The app's sources, without specs, e2e, test helpers and the generated tree. */
function isAppSource(fileName) {
	const relative = path.relative(REPO_ROOT, fileName).split(path.sep).join('/');

	return (
		/^(apps|libs)\//.test(relative) &&
		!/(^|\/)(node_modules|e2e|test|testing)\//.test(relative) &&
		!/\.(spec|test)\.[cm]?[jt]sx?$/.test(relative) &&
		!relative.endsWith('routeTree.gen.ts')
	);
}

function createAppProgram() {
	const config = ts.getParsedCommandLineOfConfigFile(
		APP_TSCONFIG,
		{},
		{
			...ts.sys,
			onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
				throw new Error(
					ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
				);
			}
		}
	);

	return ts.createProgram({
		rootNames: config.fileNames,
		options: config.options,
		projectReferences: config.projectReferences
	});
}

function main() {
	const findings = findUntypedLinks(createAppProgram(), isAppSource);

	for (const { fileName, line, column, text } of findings) {
		console.error(
			`${path.relative(
				REPO_ROOT,
				fileName
			)}:${line}:${column}  internal link ${text} is not typed: use a typed link (TanStack \`Link\`, \`LinkWithProject\`, \`useNavigateWithProject\`) or \`linkOptions({ to }).to\``
		);
	}

	if (findings.length) {
		console.error(`\n${findings.length} untyped internal link(s).`);
		process.exit(1);
	}

	console.log('Typed-link gate: every internal link is typed.');
}

if (require.main === module) main();

module.exports = { findUntypedLinks, isAppSource };
