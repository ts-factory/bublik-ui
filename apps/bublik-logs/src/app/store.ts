import {
	GetLogJsonInputs,
	RootBlock,
	TreeDataAPIResponse
} from '@/shared/types';
import { transformLogTree } from '@/shared/utils';
import { configureStore } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const JSON_API_KEY = 'json-api';

const jsonAPI = createApi({
	reducerPath: JSON_API_KEY,
	baseQuery: fetchBaseQuery({}),
	endpoints: (builder) => ({
		getJsonTree: builder.query<TreeDataAPIResponse | null, void>({
			query: (s) => '/json/tree.json',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			transformResponse: (d) => transformLogTree(d as any)
		}),
		getJsonLog: builder.query<RootBlock, GetLogJsonInputs>({
			query: ({ id, page }) => {
				if (!id && !page) return `/json/node_1_0.json`;

				return page ? `/json/node_id${id}_p${page}` : `/json/node_id${id}.json`;
			},
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
