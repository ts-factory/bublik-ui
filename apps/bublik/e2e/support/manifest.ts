/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { readFileSync } from 'fs';
import path from 'path';

import type {
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

// The shapes come from manifest.gen.ts, generated from the bublik-e2e CLI's
// schema (`pnpm run e2e:codegen`); the aliases keep the suite's historical
// type names.
type E2eManifest = E2EManifest;
type BundleEntry = Bundle;
type SampleTest = IterationEntry;
type ManifestConfig = ReportConfig;

function resolveManifestPath(): string {
	if (process.env['BUBLIK_E2E_RUN_OVERVIEW']) {
		return path.resolve(process.env['BUBLIK_E2E_RUN_OVERVIEW']);
	}

	return path.resolve(process.cwd(), '..', '..', '.e2e', 'e2e-manifest.json');
}

function readManifest(): E2eManifest | null {
	try {
		const raw = readFileSync(resolveManifestPath(), 'utf-8');
		return JSON.parse(raw) as E2eManifest;
	} catch {
		return null;
	}
}

function requireManifest(): E2eManifest {
	const manifest = readManifest();

	if (!manifest) {
		throw new Error('BUBLIK_E2E_RUN_OVERVIEW not set or manifest is empty.');
	}
	if (manifest.version !== 1) {
		throw new Error(`Unsupported E2E manifest version: ${manifest.version}`);
	}

	return manifest;
}

export { readManifest, requireManifest, resolveManifestPath };

export type {
	E2eManifest,
	ManifestConfig,
	BundleEntry,
	ExpectedRun,
	ExpectedMatrix,
	SampleTest,
	Revision,
	PackageSummary,
	MeasurementSummary
};
