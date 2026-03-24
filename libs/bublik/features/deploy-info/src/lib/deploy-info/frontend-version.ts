/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { VersionSummary } from '@/services/bublik-api';

import frontendInfo from '../git-info.json';

const frontendAppVersion =
	frontendInfo.latestTag || frontendInfo.revision || '';

const frontendVersion: VersionSummary = {
	branch: frontendInfo.branch,
	revision: frontendInfo.revision,
	date: new Date(frontendInfo.date),
	tag: frontendInfo.latestTag,
	summary: frontendInfo.summary
};

export { frontendAppVersion, frontendVersion };
