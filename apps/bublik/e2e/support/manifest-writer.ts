/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';

import { E2eManifest, resolveManifestPath } from './manifest';

function writeManifest(manifest: E2eManifest): void {
	const resolvedPath = resolveManifestPath();
	const dir = path.dirname(resolvedPath);

	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}

	writeFileSync(resolvedPath, JSON.stringify(manifest, null, 2) + '\n');
}

export { writeManifest };
