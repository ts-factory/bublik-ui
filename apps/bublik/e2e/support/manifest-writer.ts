/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'fs';
import path from 'path';

import { assertValidManifest, resolveManifestPath } from './manifest';
import type { E2EManifest } from './manifest';

function writeManifest(manifest: E2EManifest): void {
	const resolvedPath = resolveManifestPath();
	const dir = path.dirname(resolvedPath);
	const serialized = JSON.stringify(manifest, null, 2) + '\n';
	const serializedManifest: unknown = JSON.parse(serialized);
	assertValidManifest(serializedManifest, `E2E manifest for "${resolvedPath}"`);

	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}

	const temporaryPath = path.join(
		dir,
		`.${path.basename(resolvedPath)}.${process.pid}.${Date.now()}.tmp`
	);

	try {
		writeFileSync(temporaryPath, serialized, { flag: 'wx' });
		renameSync(temporaryPath, resolvedPath);
	} finally {
		if (existsSync(temporaryPath)) rmSync(temporaryPath);
	}
}

export { writeManifest };
