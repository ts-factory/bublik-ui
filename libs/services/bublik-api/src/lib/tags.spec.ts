/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { BUBLIK_TAG } from './types';
import { configDependent, tagTypes } from './tags';

const LIB_DIR = __dirname;

/** Every `Name = 'value'` member declared in the `BUBLIK_TAG` enum. */
function declaredTagValues(): string[] {
	const source = readFileSync(join(LIB_DIR, 'types', 'index.ts'), 'utf-8');
	const body = source.slice(source.indexOf('enum BUBLIK_TAG'));

	return Array.from(body.matchAll(/\w+ = '([^']+)'/g), (match) => match[1]);
}

/** Every endpoint source file, including the nested `import/` group. */
function endpointFiles(): string[] {
	const root = join(LIB_DIR, 'endpoints');
	const walk = (dir: string): string[] =>
		readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
			const path = join(dir, entry.name);
			if (entry.isDirectory()) return walk(path);
			return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')
				? [path]
				: [];
		});

	return walk(root);
}

describe('tagTypes', () => {
	// A tag missing from `tagTypes` still invalidates, but RTK Query logs a
	// console error for every use of it in development. `BUBLIK_TAG` is a
	// `const enum`, so nothing at runtime can catch a member that was added to
	// the enum and forgotten here.
	it('registers every BUBLIK_TAG member', () => {
		expect([...tagTypes].sort()).toEqual(declaredTagValues().sort());
	});

	it('registers every tag the endpoints reference as a bare string', () => {
		const literals = endpointFiles().flatMap((file) =>
			Array.from(
				readFileSync(file, 'utf-8').matchAll(
					/(?:provides|invalidates)Tags: \[([^\]]*)\]/g
				),
				(match) => Array.from(match[1].matchAll(/'([^']+)'/g), (m) => m[1])
			).flat()
		);

		expect(
			literals.filter((tag) => !tagTypes.includes(tag as BUBLIK_TAG))
		).toEqual([]);
	});
});

describe('configDependent', () => {
	it('tags a query with Config so a config save refetches it', () => {
		expect(configDependent()).toEqual([BUBLIK_TAG.Config]);
	});

	it('keeps the tags it is given', () => {
		expect(
			configDependent(BUBLIK_TAG.Run, { type: BUBLIK_TAG.Run, id: 1 })
		).toEqual([
			BUBLIK_TAG.Config,
			BUBLIK_TAG.Run,
			{ type: BUBLIK_TAG.Run, id: 1 }
		]);
	});
});
