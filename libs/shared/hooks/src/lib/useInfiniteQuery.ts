/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect, useRef, useState } from 'react';
import { QueryDefinition } from '@reduxjs/toolkit/dist/query';
import { QueryHooks } from '@reduxjs/toolkit/dist/query/react/buildHooks';

// infer result type from endpoint - there is probably a better way of doing this
type GetResultTypeFromEndpoint<Endpoint> = Endpoint extends QueryHooks<
	QueryDefinition<any, any, string, infer ResultType, string>
>
	? ResultType
	: never;

interface UseInfiniteQueryOptions<ResultType> {
	getNextPageParam(lastPage: ResultType): any;
}

// const result = useInfiniteQuery(myApi.endpoints.listContacts, {
//     getNextPageParam: (lastPage) => lastPage.meta.nextPage ?? undefined,
//   });

export function useInfiniteQuery<
	Endpoint extends QueryHooks<QueryDefinition<any, any, any, any, any>>,
	ResultType = GetResultTypeFromEndpoint<Endpoint>
>(endpoint: Endpoint, options: UseInfiniteQueryOptions<ResultType>) {
	const nextPage = useRef<number | undefined>(undefined);
	const [pages, setPages] = useState<Array<ResultType> | undefined>(undefined);
	const [trigger, result] = endpoint.useLazyQuery();

	useEffect(() => {
		trigger({ page: undefined });
	}, []);

	useEffect(() => {
		if (!result.isSuccess) return;
		nextPage.current = options.getNextPageParam(result.data);
		setPages([...(pages ?? []), result.data]);
	}, [options, pages, result.data, result.isSuccess]);

	return {
		...result,
		data: pages,
		isLoading: result.isFetching && pages === undefined,
		hasNextPage: nextPage.current !== undefined,

		fetchNextPage() {
			if (nextPage.current !== undefined) {
				trigger({ page: nextPage.current });
			}
		}
	};
}
