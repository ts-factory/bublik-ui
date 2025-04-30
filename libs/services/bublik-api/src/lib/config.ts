/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { BaseQueryFn, FetchBaseQueryArgs } from '@reduxjs/toolkit/query';

import { config } from '@/bublik/config';

export type BublikBaseQueryFn = BaseQueryFn;

/**
 * Return API config for base query to use
 * It will take root url produced from BASE_URL from env
 * Example:
 * If application is mounted at `/prefix/v2`, root URL would be `/prefix`
 */
export const getAPIConfig = (): FetchBaseQueryArgs => {
	return { baseUrl: `${config.rootUrl}` };
};

/**
 * Function that will take endpoint URL string and return properly completed string to query to
 * @param endpointUrl - URL you want to query should start with `/` (e.g `/runs`)
 * @param disableTrailingSlash -  URL without trailing slash
 */
export const withApiV2 = (
	endpointUrl: string,
	disableTrailingSlash?: boolean
) => {
	const API_V2_PREFIX = `/api/v2`;

	const searchParamsAndNotDisabledTrailingSlash =
		endpointUrl.includes('?') &&
		(typeof disableTrailingSlash === 'undefined' || !disableTrailingSlash);

	if (searchParamsAndNotDisabledTrailingSlash) {
		throw new Error('Must disable trailing slash when search params present!');
	}

	if (disableTrailingSlash) {
		return `${API_V2_PREFIX}${endpointUrl}`;
	}

	return `${API_V2_PREFIX}${endpointUrl}/`;
};
