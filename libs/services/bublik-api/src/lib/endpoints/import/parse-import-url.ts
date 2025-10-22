/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ImportRunInput } from '@/shared/types';
import { formatTimeToAPI } from '@/shared/utils';

const TRAILING_SLASHES = /\/+$/;

export const getUrl = (run: ImportRunInput) => {
	const FORCE_PARAM_KEY = 'force';
	const START_DATE_PARAM_KEY = 'from';
	const END_DATE_PARAM_KEY = 'to';
	const PROJECT_PARAM_KEY = 'project';

	const originalUrl = new URL(run.url);

	if (run.force) {
		originalUrl.searchParams.set(FORCE_PARAM_KEY, 'true');
	}

	if (run.project) {
		originalUrl.searchParams.set(PROJECT_PARAM_KEY, run.project.toString());
	}

	if (!run.range) {
		return originalUrl;
	}

	originalUrl.searchParams.set(
		START_DATE_PARAM_KEY,
		formatTimeToAPI(run.range.startDate)
	);
	originalUrl.searchParams.set(
		END_DATE_PARAM_KEY,
		formatTimeToAPI(run.range.endDate)
	);

	return originalUrl;
};

export const runToImportUrl = (run: ImportRunInput) => {
	const finalUrl = getUrl(run);

	let result = `?url=${finalUrl.origin}${finalUrl.pathname.replace(
		TRAILING_SLASHES,
		''
	)}`;

	for (const [key, value] of finalUrl.searchParams.entries()) {
		result += `&${key}=${value.replace(TRAILING_SLASHES, '')}`;
	}

	return result.replace(TRAILING_SLASHES, '');
};
