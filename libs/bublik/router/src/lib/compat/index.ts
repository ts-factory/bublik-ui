/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/**
 * The Phase 2 compat layer: react-router-dom and use-query-params
 * shaped APIs on the TanStack router. A page migrates off them in Phase 3 by
 * moving to the typed route APIs; nothing new should import from here.
 */
export { Outlet, useCanGoBack } from '@tanstack/react-router';

export { matchPath } from '../match/path-pattern';
export type { PathMatch, PathPattern } from '../match/path-pattern';
export {
	createSearchParams,
	Link,
	Navigate,
	useLocation,
	useNavigate,
	useParams,
	useSearchParams
} from './navigation';
export type {
	LinkProps,
	NavigateFunction,
	NavigateOptions,
	NavigateProps,
	SetURLSearchParams,
	URLSearchParamsInit
} from './navigation';
export {
	ArrayParam,
	BooleanParam,
	DateParam,
	JsonParam,
	NumberParam,
	NumericArrayParam,
	StringParam,
	useQueryParam,
	useQueryParams,
	withDefault
} from './query-params';
export type {
	DecodedValueMap,
	EncodedValue,
	NewValueType,
	QueryParamConfig,
	QueryParamConfigMap,
	QueryParamOptions,
	SetQuery,
	UrlUpdateType
} from './query-params';
export { createPath, parsePath } from './to';
export type { Path, To } from '../path/to';
