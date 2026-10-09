/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/**
 * The routing grep gate: TanStack
 * Router is the only router, `@/router` the only place that touches
 * `window.history`. Fails on
 *
 * - an import of a removed router or query-param package, or one of them
 *   back in package.json;
 * - `history.pushState`/`replaceState` calls and `history.state` reads
 *   outside `libs/bublik/router` (TanStack keeps `__TSR_index`/`__TSR_key`
 *   in `history.state`; writing past it breaks back/forward and blockers).
 *
 * Comments are ignored, so code may still explain why it does not do these.
 */
const { readdirSync, readFileSync } = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SCANNED_DIRS = ['apps', 'libs'];
const SKIPPED_DIRS = new Set(['node_modules', 'dist', 'dist-nx', '.tanstack']);
const EXTENSIONS = /\.(c|m)?(j|t)sx?$/;
const ROUTER_LIB = 'libs/bublik/router/';

const REMOVED_PACKAGES = [
	'react-router',
	'react-router-dom',
	'use-query-params',
	'serialize-query-params',
	'react-location',
	'react-location-jsurl'
];

const removedImport = new RegExp(
	String.raw`(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"](${REMOVED_PACKAGES.join(
		'|'
	)})(?:/[^'"]*)?['"]`,
	'g'
);

const HISTORY_RULES = [
	{
		pattern:
			/(?<![\w.$])(?:window\.)?history\.(?:pushState|replaceState)\s*\(/g,
		message:
			'writes window.history directly; navigate through the router (`useSearchWriter`, `useNavigate`, `<Link>`)'
	},
	{
		pattern: /(?<![\w.$])(?:window\.)?history\.state\b/g,
		message:
			'reads window.history.state; read `location.state` from the router (`useRenderedLocation`, `useLocation`)'
	}
];

/** Blanks out comments, keeping line breaks so line numbers stay right. */
function stripComments(source) {
	return source
		.replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
		.replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
}

function collectFiles(dir) {
	let entries;
	try {
		entries = readdirSync(dir, { withFileTypes: true });
	} catch {
		return [];
	}

	return entries.flatMap((entry) => {
		const absolutePath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			return SKIPPED_DIRS.has(entry.name) ? [] : collectFiles(absolutePath);
		}
		return EXTENSIONS.test(entry.name) ? [absolutePath] : [];
	});
}

function lineOf(source, index) {
	return source.slice(0, index).split('\n').length;
}

function checkFile(absolutePath) {
	const file = path.relative(REPO_ROOT, absolutePath);
	const source = stripComments(readFileSync(absolutePath, 'utf-8'));
	const errors = [];

	for (const match of source.matchAll(removedImport)) {
		errors.push(
			`${file}:${lineOf(source, match.index)} imports '${
				match[1]
			}'; route with TanStack Router through \`@/router\``
		);
	}

	if (file.startsWith(ROUTER_LIB)) return errors;

	for (const { pattern, message } of HISTORY_RULES) {
		for (const match of source.matchAll(pattern)) {
			errors.push(`${file}:${lineOf(source, match.index)} ${message}`);
		}
	}

	return errors;
}

function checkPackageJson() {
	const manifest = JSON.parse(
		readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf-8')
	);
	const declared = {
		...manifest.dependencies,
		...manifest.devDependencies,
		...manifest.peerDependencies
	};

	return REMOVED_PACKAGES.filter((name) => name in declared).map(
		(name) => `package.json depends on '${name}', which the router gate forbids`
	);
}

function main() {
	const files = SCANNED_DIRS.flatMap((dir) =>
		collectFiles(path.join(REPO_ROOT, dir))
	);
	const errors = [...checkPackageJson(), ...files.flatMap(checkFile)];

	if (errors.length) {
		console.error(`Router gate: ${errors.length} error(s):`);
		for (const error of errors) console.error(`  ${error}`);
		console.error('\nSee the Router Integration section of AGENTS.md.');
		process.exit(1);
	}

	if (!process.argv.includes('--quiet')) {
		console.log(`Router gate: ${files.length} file(s) checked, no violations.`);
	}
}

main();
