/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
const { readFileSync, writeFileSync } = require('fs');
const path = require('path');
const { compile } = require('json-schema-to-typescript');
const prettier = require('prettier');

const REPO_ROOT = path.resolve(__dirname, '..');
const SCHEMA_RELATIVE_PATH = 'apps/bublik/e2e/support/e2e-manifest.schema.json';
const OUTPUT_RELATIVE_PATH = 'apps/bublik/e2e/support/manifest.gen.ts';
const SCHEMA_PATH = path.join(REPO_ROOT, SCHEMA_RELATIVE_PATH);
const OUTPUT_PATH = path.join(REPO_ROOT, OUTPUT_RELATIVE_PATH);

const BANNER = `/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable */
/**
 * Generated from ${SCHEMA_RELATIVE_PATH} — do not edit by hand.
 *
 * The schema comes from the bublik-e2e CLI's Pydantic models
 * (\`bublik-e2e schema --out ${SCHEMA_RELATIVE_PATH}\`).
 * Regenerate with \`pnpm run e2e:codegen\` after updating the schema;
 * \`pnpm run e2e:codegen:check\` fails when this file is stale.
 */`;

(async () => {
	const check = process.argv.includes('--check');
	const raw = readFileSync(SCHEMA_PATH, 'utf-8').replace(
		/#\/\$defs\//g,
		'#/definitions/'
	);
	const schema = JSON.parse(raw);
	schema.definitions = schema.$defs;
	delete schema.$defs;

	const compiled = await compile(schema, 'E2EManifest', {
		bannerComment: BANNER,
		cwd: REPO_ROOT,
		style: { useTabs: true, singleQuote: true, trailingComma: 'none' }
	});
	const generated = await prettier.format(compiled, {
		...(await prettier.resolveConfig(OUTPUT_PATH)),
		filepath: OUTPUT_PATH
	});

	if (check) {
		let current = '';
		try {
			current = readFileSync(OUTPUT_PATH, 'utf-8');
		} catch {}
		if (current !== generated) {
			console.error(
				`${OUTPUT_RELATIVE_PATH} is stale; run \`pnpm run e2e:codegen\` and commit the result.`
			);
			process.exit(1);
		}
		console.log(`${OUTPUT_RELATIVE_PATH} is up to date`);
		return;
	}

	writeFileSync(OUTPUT_PATH, generated, 'utf-8');
	console.log(OUTPUT_RELATIVE_PATH);
})();
