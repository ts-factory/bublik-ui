/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
const { readdirSync, readFileSync, statSync } = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const E2E_RELATIVE_DIR = 'apps/bublik/e2e';
const FEATURES_RELATIVE_DIR = `${E2E_RELATIVE_DIR}/features`;
const ROUTE_TREE_RELATIVE_PATH = 'apps/bublik/src/routeTree.gen.ts';
const E2E_DIR = path.join(REPO_ROOT, E2E_RELATIVE_DIR);
const FEATURES_DIR = path.join(REPO_ROOT, FEATURES_RELATIVE_DIR);
const ROUTE_TREE_PATH = path.join(REPO_ROOT, ROUTE_TREE_RELATIVE_PATH);

const SCENARIO_KEYWORDS = ['Scenario', 'Example'];
const OUTLINE_KEYWORDS = ['Scenario Outline', 'Scenario Template'];
const EXAMPLES_KEYWORDS = ['Examples', 'Scenarios'];

function relative(absolutePath) {
	return path.relative(REPO_ROOT, absolutePath);
}

function collectFiles(dir, predicate) {
	let entries;
	try {
		entries = readdirSync(dir, { withFileTypes: true });
	} catch {
		return [];
	}

	const files = [];
	for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
		const absolutePath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...collectFiles(absolutePath, predicate));
		} else if (predicate(entry.name)) {
			files.push(absolutePath);
		}
	}
	return files;
}

function splitTableRow(line) {
	const trimmed = line.trim();
	const cells = trimmed.slice(1, -1).split('|');
	return cells.map((cell) => cell.trim());
}

function matchKeyword(line, keywords) {
	for (const keyword of keywords) {
		if (line.startsWith(`${keyword}:`)) {
			return line.slice(keyword.length + 1).trim();
		}
	}
	return null;
}

/**
 * The page routes of the generated route tree: every route in its
 * `FileRoutesByPath` that has no child route (layouts and pathless routes
 * only wrap pages), as `{ id, fullPath }`.
 */
function parseRouteTree() {
	const source = readFileSync(ROUTE_TREE_PATH, 'utf-8');
	const block = source.match(/interface FileRoutesByPath \{([\s\S]*?)\n {2}\}/);
	if (!block) {
		throw new Error(`${ROUTE_TREE_RELATIVE_PATH} has no FileRoutesByPath`);
	}

	const routes = [];
	const entry = /id: '([^']*)';\s*path: '[^']*';\s*fullPath: '([^']*)';/g;
	for (const [, id, fullPath] of block[1].matchAll(entry)) {
		routes.push({ id, fullPath });
	}

	// An index route (`/_app/`) is always a page; any other route is a
	// layout when another route's id continues it.
	return routes.filter(
		({ id }) =>
			id.endsWith('/') || !routes.some((other) => other.id.startsWith(`${id}/`))
	);
}

const ROUTE_COMMENT = /^#\s*Route:\s*(\S+)\s*$/;

function parseFeature(absolutePath) {
	const lines = readFileSync(absolutePath, 'utf-8').split(/\r?\n/);
	const feature = {
		file: relative(absolutePath),
		name: null,
		routes: [],
		scenarios: [],
		errors: []
	};

	let pendingTags = [];
	let current = null;
	let examplesHeaderSeen = false;

	const finishOutline = () => {
		if (current && current.isOutline && current.examples.length === 0) {
			feature.errors.push(
				`${feature.file}:${current.line} Scenario Outline "${current.name}" has no Examples rows`
			);
		}
	};

	lines.forEach((rawLine, index) => {
		const lineNumber = index + 1;
		const line = rawLine.trim();

		const route = line.match(ROUTE_COMMENT);
		if (route) {
			feature.routes.push({ path: route[1], line: lineNumber });
			return;
		}

		if (!line || line.startsWith('#')) return;

		if (line.startsWith('@')) {
			pendingTags.push(
				...line.split(/\s+/).filter((tag) => tag.startsWith('@'))
			);
			return;
		}

		if (line.startsWith('Feature:')) {
			feature.name = line.slice('Feature:'.length).trim();
			pendingTags = [];
			return;
		}

		const outlineName = matchKeyword(line, OUTLINE_KEYWORDS);
		const scenarioName =
			outlineName === null ? matchKeyword(line, SCENARIO_KEYWORDS) : null;

		if (outlineName !== null || scenarioName !== null) {
			finishOutline();
			examplesHeaderSeen = false;
			current = {
				name: outlineName ?? scenarioName,
				isOutline: outlineName !== null,
				tags: pendingTags,
				line: lineNumber,
				examples: []
			};
			pendingTags = [];

			if (!current.name) {
				feature.errors.push(
					`${feature.file}:${lineNumber} Scenario has an empty name`
				);
				return;
			}

			feature.scenarios.push(current);
			return;
		}

		if (matchKeyword(line, EXAMPLES_KEYWORDS) !== null) {
			if (!current || !current.isOutline) {
				feature.errors.push(
					`${feature.file}:${lineNumber} Examples block without a preceding Scenario Outline`
				);
			}
			examplesHeaderSeen = false;
			pendingTags = [];
			return;
		}

		if (line.startsWith('|') && current && current.isOutline) {
			if (!examplesHeaderSeen) {
				examplesHeaderSeen = true;
				return;
			}
			const [first] = splitTableRow(line);
			if (first) current.examples.push({ value: first, line: lineNumber });
			return;
		}

		pendingTags = [];
	});

	finishOutline();

	if (!feature.name) {
		feature.errors.push(`${feature.file} has no "Feature:" line`);
	}

	return feature;
}

const TITLE_PATTERN =
	/\btest\s*(?:\.\s*(?:describe|only|skip|fixme|fail|slow|serial|parallel)\s*)*\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;

function parseSpec(absolutePath) {
	const source = readFileSync(absolutePath, 'utf-8');
	const file = relative(absolutePath);
	const titles = [];

	for (const match of source.matchAll(TITLE_PATTERN)) {
		const [, quote, raw] = match;
		if (quote === '`' && raw.includes('${')) continue;

		const line = source.slice(0, match.index).split('\n').length;
		titles.push({ text: raw.replace(/\\(['"`\\])/g, '$1'), file, line });
	}

	return titles;
}

function main() {
	const quiet = process.argv.includes('--quiet');
	const listOrphans = process.argv.includes('--list-orphans');
	const featureFiles = collectFiles(FEATURES_DIR, (name) =>
		name.endsWith('.feature')
	);
	const specFiles = collectFiles(E2E_DIR, (name) => name.endsWith('.spec.ts'));

	const features = featureFiles.map(parseFeature);
	const titles = specFiles.flatMap(parseSpec);
	const titleIndex = new Map();
	for (const title of titles) {
		if (!titleIndex.has(title.text)) titleIndex.set(title.text, []);
		titleIndex.get(title.text).push(title);
	}

	const errors = features.flatMap((feature) => feature.errors);
	const seen = new Map();
	const matchedTitles = new Set();
	let scenarioCount = 0;

	for (const feature of features) {
		for (const scenario of feature.scenarios) {
			scenarioCount += 1;
			const location = `${feature.file}:${scenario.line}`;
			const previous = seen.get(scenario.name);
			if (previous) {
				errors.push(
					`${location} duplicate scenario name "${scenario.name}" (also at ${previous})`
				);
			} else {
				seen.set(scenario.name, location);
			}

			const expectations = [{ name: scenario.name, at: location }];
			for (const example of scenario.examples) {
				expectations.push({
					name: example.value,
					at: `${feature.file}:${example.line}`
				});
			}

			for (const expectation of expectations) {
				if (titleIndex.has(expectation.name)) {
					matchedTitles.add(expectation.name);
				} else {
					const kind = scenario.isOutline ? 'Scenario Outline' : 'Scenario';
					errors.push(
						`${expectation.at} no Playwright test titled "${expectation.name}" (${kind} "${scenario.name}")`
					);
				}
			}
		}
	}

	const pageRoutes = parseRouteTree();
	const declared = new Map();
	for (const feature of features) {
		for (const route of feature.routes) {
			const at = `${feature.file}:${route.line}`;
			if (!pageRoutes.some(({ fullPath }) => fullPath === route.path)) {
				errors.push(
					`${at} "# Route: ${route.path}" is not a page route of ${ROUTE_TREE_RELATIVE_PATH}`
				);
			}
			if (!declared.has(route.path)) declared.set(route.path, at);
		}
	}
	for (const { id, fullPath } of pageRoutes) {
		if (!declared.has(fullPath)) {
			errors.push(
				`route "${fullPath}" (${id}) has no feature file: add "# Route: ${fullPath}" to the .feature that covers it`
			);
		}
	}

	const orphans = titles.filter((title) => !matchedTitles.has(title.text));

	if (!quiet) {
		console.log(
			`${FEATURES_RELATIVE_DIR}: ${featureFiles.length} feature file(s), ${scenarioCount} scenario(s)`
		);
		console.log(
			`${E2E_RELATIVE_DIR}: ${specFiles.length} spec file(s), ${titles.length} test title(s)`
		);
		console.log(
			`${ROUTE_TREE_RELATIVE_PATH}: ${pageRoutes.length} page route(s), ${declared.size} with a feature file`
		);

		if (orphans.length && listOrphans) {
			console.log(
				`\n${orphans.length} test title(s) not traced to any scenario (informational):`
			);
			for (const orphan of orphans) {
				console.log(`  ${orphan.file}:${orphan.line} "${orphan.text}"`);
			}
		} else if (orphans.length) {
			console.log(
				`${orphans.length} test title(s) not traced to any scenario (--list-orphans to see them)`
			);
		}
	}

	if (errors.length) {
		console.error(`\n${errors.length} error(s):`);
		for (const error of errors) console.error(`  ${error}`);
		console.error(
			`\nSee ${FEATURES_RELATIVE_DIR}/README.md for the scenario/test naming contract.`
		);
		process.exit(1);
	}

	if (!quiet) {
		console.log(
			'\nEvery route has a feature file and every scenario a matching Playwright test.'
		);
	}
}

main();
