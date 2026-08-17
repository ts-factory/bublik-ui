/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/**
 * Keeps `apps/bublik/e2e/features/*.feature` honest.
 *
 * The suite deliberately has no BDD runner: the `.feature` files are plain
 * documentation and the binding to Playwright is a naming convention (see
 * apps/bublik/e2e/features/README.md):
 *
 *   Scenario: <name>          -> test('<name>', ...)
 *   Scenario Outline: <name>  -> test.describe('<name>') + one test per
 *                                Examples row, titled with the row's first cell
 *
 * This script fails when a scenario has no test, or when two scenarios share a
 * name (which would make the mapping ambiguous). Tests that cannot be traced
 * back to a scenario are reported for information only.
 *
 * Usage: node tools/check-e2e-features.cjs [--quiet] [--list-orphans]
 */
const { readdirSync, readFileSync, statSync } = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const E2E_RELATIVE_DIR = 'apps/bublik/e2e';
const FEATURES_RELATIVE_DIR = `${E2E_RELATIVE_DIR}/features`;
const E2E_DIR = path.join(REPO_ROOT, E2E_RELATIVE_DIR);
const FEATURES_DIR = path.join(REPO_ROOT, FEATURES_RELATIVE_DIR);

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
 * Line-based Gherkin reader. It only understands what the convention uses —
 * Feature, Background, Scenario, Scenario Outline, Examples and tags — which is
 * enough to validate the mapping without pulling in a parser dependency.
 */
function parseFeature(absolutePath) {
	const lines = readFileSync(absolutePath, 'utf-8').split(/\r?\n/);
	const feature = {
		file: relative(absolutePath),
		name: null,
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

		if (!line || line.startsWith('#')) return;

		if (line.startsWith('@')) {
			pendingTags.push(...line.split(/\s+/).filter((tag) => tag.startsWith('@')));
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
		// Template literals with interpolation cannot be resolved statically;
		// scenarios must use fixed names, so such titles are simply not traced.
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

	const orphans = titles.filter((title) => !matchedTitles.has(title.text));

	if (!quiet) {
		console.log(
			`${FEATURES_RELATIVE_DIR}: ${featureFiles.length} feature file(s), ${scenarioCount} scenario(s)`
		);
		console.log(
			`${E2E_RELATIVE_DIR}: ${specFiles.length} spec file(s), ${titles.length} test title(s)`
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

	if (!quiet) console.log('\nEvery scenario has a matching Playwright test.');
}

main();
