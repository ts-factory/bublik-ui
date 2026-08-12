/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { existsSync, readFileSync } from 'fs';
import path from 'path';

import Ajv2020 from 'ajv/dist/2020';

import manifestSchema from './e2e-manifest.schema.json';
import type { E2EManifest } from './manifest.gen';

const ajv = new Ajv2020({ allErrors: true });
const validateManifest = ajv.compile<E2EManifest>(manifestSchema);

function resolveManifestPath(): string {
	const configuredPath = process.env['BUBLIK_E2E_RUN_OVERVIEW']?.trim();
	if (configuredPath) {
		return path.resolve(configuredPath);
	}

	const searchRoots = [process.cwd(), path.resolve(__dirname, '../../../..')];
	for (const searchRoot of searchRoots) {
		let current = searchRoot;
		let reachedFilesystemRoot = false;

		while (!reachedFilesystemRoot) {
			const candidate = path.join(current, '.e2e', 'e2e-manifest.json');
			if (existsSync(candidate)) return candidate;

			const parent = path.dirname(current);
			reachedFilesystemRoot = parent === current;
			current = parent;
		}
	}

	throw new Error(
		'Unable to resolve the E2E manifest. Set BUBLIK_E2E_RUN_OVERVIEW to ' +
			'the generated e2e-manifest.json path or generate .e2e/e2e-manifest.json ' +
			'in the workspace hierarchy.'
	);
}

function assertValidManifest(
	value: unknown,
	manifestPath = 'E2E manifest'
): asserts value is E2EManifest {
	if (!validateManifest(value)) {
		throw new Error(
			`${manifestPath} does not match the committed schema:\n${ajv.errorsText(
				validateManifest.errors,
				{ separator: '\n' }
			)}`
		);
	}
}

function readManifest(): E2EManifest {
	const manifestPath = resolveManifestPath();
	let raw: string;

	try {
		raw = readFileSync(manifestPath, 'utf-8');
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		throw new Error(
			`Unable to read E2E manifest at "${manifestPath}": ${reason}`,
			{
				cause: error
			}
		);
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		throw new Error(
			`Invalid JSON in E2E manifest at "${manifestPath}": ${reason}`,
			{
				cause: error
			}
		);
	}

	assertValidManifest(parsed, `E2E manifest at "${manifestPath}"`);

	return parsed;
}

function requireManifest(): E2EManifest {
	return readManifest();
}

export {
	assertValidManifest,
	readManifest,
	requireManifest,
	resolveManifestPath
};

export type {
	Bundle,
	E2EManifest,
	ExpectedMatrix,
	ExpectedRun,
	IterationEntry,
	MeasurementSummary,
	PackageSummary,
	ReportConfig,
	Revision
} from './manifest.gen';
