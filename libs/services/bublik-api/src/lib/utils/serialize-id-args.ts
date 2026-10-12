/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	defaultSerializeQueryArgs,
	type SerializeQueryArgs
} from '@reduxjs/toolkit/query/react';

const idKey = (value: unknown) =>
	typeof value === 'number' ? String(value) : value;

/**
 * `serializeQueryArgs` of an endpoint whose argument is an id, or an object
 * of ids: `1` and `'1'` make one cache entry. The routes parse ids to numbers
 * while other readers hold them as API strings, and a route
 * loader's prefetch must land in the entry the page then reads.
 */
const serializeIdArgs: SerializeQueryArgs<unknown> = ({
	queryArgs,
	...rest
}) => {
	const normalized =
		queryArgs && typeof queryArgs === 'object' && !Array.isArray(queryArgs)
			? Object.fromEntries(
					Object.entries(queryArgs).map(([key, value]) => [key, idKey(value)])
			  )
			: idKey(queryArgs);

	return defaultSerializeQueryArgs({ queryArgs: normalized, ...rest });
};

export { serializeIdArgs };
