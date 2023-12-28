/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { config } from '@/bublik/config';

export const printDevInfoToConsole = () => {
	console.groupCollapsed('ENVIRONMENT INFO');

	if (config.isProd) console.log('%cMODE: PRODUCTION', 'color: #00ff00');
	if (config.isDev) console.log('%cMODE: DEVELOPMENT', 'color: #00ff00');

	console.log(`%cBASE_URL: ${config?.baseUrl}`, 'color: #04d9f5');
	console.log(`%cBASE_URL_API: ${config?.baseUrlApi}`, 'color: #ff00ff');
	console.log(`%cBASE_OLD_URL: ${config?.oldBaseUrl}`, 'color: #ffff00');

	console.groupEnd();
};
