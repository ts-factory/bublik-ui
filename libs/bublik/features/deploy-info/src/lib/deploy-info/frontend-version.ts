/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { VersionSummary } from '@/services/bublik-api';
import { config } from '@/bublik/config';

import frontendInfo from '../git-info.json';

const frontendAppVersion =
	frontendInfo.latestTag || frontendInfo.revision || '';

// Only release tags have a blog post; a bare revision has nothing to link to.
const frontendReleaseNotesUrl = /^v\d+\.\d+\.\d+/.test(frontendInfo.latestTag)
	? `${config.oldBaseUrl}/docs/blog/release-${frontendInfo.latestTag}`
	: undefined;

const frontendVersion: VersionSummary = {
	branch: frontendInfo.branch,
	revision: frontendInfo.revision,
	date: new Date(frontendInfo.date),
	tag: frontendInfo.latestTag,
	summary: frontendInfo.summary
};

export { frontendAppVersion, frontendReleaseNotesUrl, frontendVersion };
