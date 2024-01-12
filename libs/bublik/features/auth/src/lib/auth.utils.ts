/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { config } from '@/bublik/config';

/**
 * Pass absolute URL and get url for use in react-router-dom
 * @returns parsed url string for use in navigate functions
 * @param base
 */
export const createGetRouterUrl =
	(base = '') =>
	(url: URL | string): string => {
		if (url === '') return '';

		const rawUrl = url instanceof URL ? url : new URL(url);

		let result = '';

		const pathname = rawUrl.pathname.replace(base, '');
		const searchParams = rawUrl.searchParams.toString();
		const hash = rawUrl.hash;

		result += pathname ? pathname : '/';
		result += searchParams ? `?${searchParams}` : '';
		result += hash ? hash : '';

		return result;
	};

export const getRouterUrl = createGetRouterUrl(config.baseUrl);

export const getLoginPageUrl = () => {
	return new URL(`${window.location.origin}${config.baseUrl}/auth/login`);
};

export const getLoginUrlWithRedirect = (
	absoluteLocation = window.location.href
) => {
	const loginUrl = new URL(
		`${window.location.origin}${config.baseUrl}/auth/login`
	);

	loginUrl.searchParams.set('redirect_url', absoluteLocation.toString());

	return loginUrl;
};
