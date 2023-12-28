/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { BublikConfig } from './types';

/**
 * Constructs URL from provided subdirectory path used for routing, iframes and API calls.
 * Subdirectory must start with `/` and not end with `/`
 */
export const constructUrl = (
	subdirectory = ''
): Pick<BublikConfig, 'baseUrl' | 'baseUrlApi' | 'oldBaseUrl' | 'rootUrl'> => {
	if (subdirectory === '' || subdirectory === '/' || subdirectory === '/v2') {
		return {
			baseUrl: '/v2',
			baseUrlApi: '/api/v2',
			oldBaseUrl: window.location.origin,
			rootUrl: ''
		};
	}

	if (
		subdirectory.length !== 1 &&
		subdirectory[subdirectory.length - 1] === '/'
	) {
		throw new Error('Subdirectory must not end with /');
	}

	if (subdirectory[0] !== '/') {
		throw new Error('Subdirectory must start with /');
	}

	const baseUrlRouter = `${subdirectory.replace('/v2', '')}/v2`;
	const baseUrlApi = `${subdirectory.replace('/v2', '')}/api/v2`;
	const baseUrlIframes = `${window.location.origin}${subdirectory.replace(
		'/v2',
		''
	)}`;
	const rootUrl = `${subdirectory.replace('/v2', '')}`;

	return {
		baseUrl: baseUrlRouter,
		baseUrlApi: baseUrlApi,
		oldBaseUrl: baseUrlIframes,
		rootUrl
	};
};
