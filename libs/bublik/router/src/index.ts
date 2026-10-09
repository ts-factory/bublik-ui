/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import './lib/history-state';

export * from './lib/compat';
export * from './lib/hooks';
export * from './lib/location';
export * from './lib/match';
// The legacy codec of the history link producers and the jsurl redirect.
// Its `parseSearch`/`stringifySearch` keep their legacy names so
// the router's raw codec in `./lib/search` owns the plain ones.
export {
	decode,
	decodeFromBinary,
	defaultParser,
	defaultStringifier,
	encode,
	encodeToBinary,
	handleOldUrlParsing,
	isOldUrl,
	parseSearch as legacyParseSearch,
	parseSearchWith,
	stringifySearch as legacyStringifySearch,
	stringifySearchWith
} from './lib/parsing';
export * from './lib/path';
export * from './lib/router';
export * from './lib/search';
