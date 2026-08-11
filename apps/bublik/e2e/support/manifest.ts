/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { readFileSync } from 'fs';
import path from 'path';

import Ajv2020 from 'ajv/dist/2020';

import manifestSchema from './e2e-manifest.schema.json';
import type { E2EManifest } from './manifest.gen';

const ajv = new Ajv2020({ allErrors: true });
const validateManifest = ajv.compile<E2EManifest>(manifestSchema);

function resolveManifestPath(): string {
	if (process.env['BUBLIK_E2E_RUN_OVERVIEW']) {
		return path.resolve(process.env['BUBLIK_E2E_RUN_OVERVIEW']);
	}

	return path.resolve(process.cwd(), '..', '..', '.e2e', 'e2e-manifest.json');
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

	if (!validateManifest(parsed)) {
		throw new Error(
			`E2E manifest at "${manifestPath}" does not match the committed schema:\n${ajv.errorsText(
				validateManifest.errors,
				{ separator: '\n' }
			)}`
		);
	}

	return parsed;
}

function requireManifest(): E2EManifest {
	return readManifest();
}

export { readManifest, requireManifest, resolveManifestPath };

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
