/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { writeFileSync, readFileSync } from 'fs';
import path from 'path';

const CHANGELOG_OUTPUT_LOCATION = `libs/bublik/features/deploy-info/src/lib/changelog.mdx`;

(() => {
	const oldChangelog = readFileSync(
		path.join(__dirname, '../CHANGELOG.md'),
		'utf-8'
	);

	const changelog = process.argv[2];
	const formatted = changelog.split('\\n').join('\n');

	writeFileSync(
		CHANGELOG_OUTPUT_LOCATION,
		`# Changelog\n\n${formatted}${oldChangelog}`
	);
})();
