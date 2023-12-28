/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { writeFileSync } from 'fs';
import { promisify } from 'util';
import * as child from 'child_process';
import { format } from 'date-fns';

const exec = promisify(child.exec);

(async () => {
	const GIT_INFO_FILE_LOCATION = `libs/bublik/features/deploy-info/src/lib/git-info.json`;

	const longSHA = (await exec('git rev-parse HEAD')).stdout.toString().trim();
	const shortSHA = (await exec('git rev-parse --short HEAD')).stdout
		.toString()
		.trim();
	const branch = (await exec('git rev-parse --abbrev-ref HEAD')).stdout
		.toString()
		.trim();
	// const authorName = (await exec("git log -1 --pretty=format:'%an'")).stdout
	//   .toString()
	//   .trim();
	const commitTime = (await exec("git log -1 --pretty=format:'%ci'")).stdout
		.toString()
		.trim();
	const commitMsg = (await exec('git log -1 --pretty=%B')).stdout
		.toString()
		.trim()
		.split('\n')[0];
	// const totalCommitCount = (await exec('git rev-list --count HEAD')).stdout
	//   .toString()
	//   .trim();
	const latestTag = (await exec('git describe --tags --abbrev=0')).stdout
		.toString()
		.trim();

	console.log(
		`version: 'v${process.env.npm_package_version}', revision: '${longSHA}', branch: '${branch}', latest tag: '${latestTag}'`
	);

	const versions = {
		date: format(new Date(commitTime), 'yyyy.MM.dd'),
		summary: commitMsg,
		revision: shortSHA,
		branch,
		latestTag: `v${process.env.npm_package_version}`
	};

	writeFileSync(GIT_INFO_FILE_LOCATION, JSON.stringify(versions));
})();
