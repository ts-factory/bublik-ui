/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { BublikConfig, BublikEnv, BublikEnvSchema } from './types';

import { DASHBOARD_POLLING_TIMER } from './constants';
import { constructUrl } from './utils';

let env: BublikEnv;
if (BublikEnvSchema.safeParse(import.meta.env).success) {
	env = import.meta.env;
} else if (import.meta.env['NODE_ENV'] === 'test') {
	env = { BASE_URL: '', MODE: '', DEV: false, PROD: false, SSR: false };
} else {
	throw new Error("Can't parse environment variables");
}

const { baseUrl, baseUrlApi, oldBaseUrl, rootUrl } = constructUrl(env.BASE_URL);

export const config = {
	baseUrl,
	baseUrlApi,
	oldBaseUrl,
	rootUrl,
	dashboardPollingTimer: DASHBOARD_POLLING_TIMER,
	isDev: env.DEV,
	isProd: env.PROD,
	isSsr: env.SSR,
	mode: env.MODE,
	queryDelimiter: ';'
} satisfies BublikConfig;
