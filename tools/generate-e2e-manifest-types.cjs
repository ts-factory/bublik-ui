/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
const { readFileSync, writeFileSync } = require('fs');
const { compile } = require('json-schema-to-typescript');

const SCHEMA_PATH = 'apps/bublik/e2e/support/e2e-manifest.schema.json';
const OUTPUT_PATH = 'apps/bublik/e2e/support/manifest.gen.ts';

const BANNER = `/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable */
/**
 * Generated from ${SCHEMA_PATH} — do not edit by hand.
 *
 * The schema comes from the bublik-e2e CLI's Pydantic models
 * (\`bublik-e2e schema --out ${SCHEMA_PATH}\`).
 * Regenerate with \`pnpm run e2e:codegen\` after updating the schema;
 * \`pnpm run e2e:codegen:check\` fails when this file is stale.
 */`;

(async () => {
	const check = process.argv.includes('--check');
	// json-schema-to-typescript only dereferences draft-07 "definitions";
	// Pydantic emits draft 2020-12 "$defs", so rewrite before compiling.
	const raw = readFileSync(SCHEMA_PATH, 'utf-8').replace(
		/#\/\$defs\//g,
		'#/definitions/'
	);
	const schema = JSON.parse(raw);
	schema.definitions = schema.$defs;
	delete schema.$defs;

	const generated = await compile(schema, 'E2eManifest', {
		bannerComment: BANNER,
		style: { useTabs: true, singleQuote: true, trailingComma: 'none' }
	});

	if (check) {
		let current = '';
		try {
			current = readFileSync(OUTPUT_PATH, 'utf-8');
		} catch {
			// missing file counts as stale
		}
		if (current !== generated) {
			console.error(
				`${OUTPUT_PATH} is stale; run \`pnpm run e2e:codegen\` and commit the result.`
			);
			process.exit(1);
		}
		console.log(`${OUTPUT_PATH} is up to date`);
		return;
	}

	writeFileSync(OUTPUT_PATH, generated, 'utf-8');
	console.log(OUTPUT_PATH);
})();
