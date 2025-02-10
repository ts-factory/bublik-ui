import { configureStore } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import {
	GetLogJsonInputs,
	RootBlock,
	TreeDataAPIResponse
} from '@/shared/types';
import { transformLogTree } from '@/shared/utils';

const JSON_API_KEY = 'json-api';

const jsonAPI = createApi({
	reducerPath: JSON_API_KEY,
	baseQuery: fetchBaseQuery({}),
	endpoints: (builder) => ({
		getJsonTree: builder.query<TreeDataAPIResponse | null, void>({
			query: () => ({
				url: '/json/tree.json',
				cache: 'no-cache'
			}),
			transformResponse: (d) => transformLogTree(d as TreeDataAPIResponse)
		}),
		getJsonLog: builder.query<RootBlock, GetLogJsonInputs>({
			query: ({ id }) => ({
				url: id ? `/json/${id}` : '/json/node_1_0.json',
				cache: 'no-cache'
			}),
			transformErrorResponse: (error) => {
				if (
					'originalStatus' in error &&
					typeof error.originalStatus === 'number' &&
					error.originalStatus === 404
				) {
					return {
						status: 404,
						title: 'Not Found',
						description: 'Log not found!'
					};
				}

				return error;
			}
		})
	})
});

const store = configureStore({
	reducer: {
		[jsonAPI.reducerPath]: jsonAPI.reducer
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({ serializableCheck: false }).concat(
			jsonAPI.middleware
		),
	devTools: true
});

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

export { type RootState, type AppDispatch, store, jsonAPI };
