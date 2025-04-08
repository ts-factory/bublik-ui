import { EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions';

import { BublikBaseQueryFn, withApiV2 } from '../config';
import { BUBLIK_TAG } from '../types';
import { API_REDUCER_PATH } from '../constants';

export const configsEndpoints = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		getAllProjects: build.query({
			query: () => ({
				url: withApiV2('/project')
			})
		}),
		createProject: build.query<unknown, number>({
			query: (id) => ({
				url: withApiV2(`/project/${id}`),
				method: 'POST'
			})
		}),
		deleteProject: build.query<unknown, number>({
			query: (id) => ({
				url: withApiV2(`/project/${id}`),
				method: 'DELETE'
			})
		}),
		updateProject: build.query<unknown, number>({
			query: (id) => ({
				url: withApiV2(`/project/${id}`),
				method: 'PATCH'
			})
		}),
		getProject: build.query<unknown, number>({
			query: (id) => ({ url: withApiV2(`/project/${id}`) })
		})
	})
};
