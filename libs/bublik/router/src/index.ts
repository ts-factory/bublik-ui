/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import './lib/history-state';

export * from './lib/link';
export * from './lib/location';
export * from './lib/match';
export * from './lib/params';
// The legacy codec of the history link producers and the jsurl redirect.
// Its `stringifySearch` keeps a legacy name so the router's raw
// codec in `./lib/search` owns the plain one.
export {
	convertOldUrlSearch,
	isOldUrl,
	stringifySearch as legacyStringifySearch
} from './lib/parsing';
export * from './lib/path';
export * from './lib/search';
