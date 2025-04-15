import { EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions';
import { z } from 'zod';

import { BublikBaseQueryFn, withApiV2 } from '../config';
import { BUBLIK_TAG } from '../types';
import { API_REDUCER_PATH } from '../constants';

const ProjectSchema = z.object({
	id: z.number(),
	name: z.string()
});

export type Project = z.infer<typeof ProjectSchema>;

const ProjectResponseSchema = z.object({
	id: z.number(),
	project_name: z.string()
});

type ProjectResponse = z.infer<typeof ProjectResponseSchema>;

export const CreateProjectSchema = z.object({
	name: z.string().min(1, 'Name is required').max(32, 'Name is too long')
});

export type CreateProject = z.infer<typeof CreateProjectSchema>;

export const projectEndpoints = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		getAllProjects: build.query<Project[], void>({
			query: () => ({
				url: withApiV2('/projects')
			}),
			transformResponse: (v: ProjectResponse[]) =>
				v.map((v) => ({ id: v.id, name: v.project_name })),
			providesTags: [BUBLIK_TAG.Project]
		}),
		createProject: build.mutation<Project, CreateProject>({
			query: (body) => ({
				url: withApiV2(`/projects`),
				method: 'POST',
				body: { project_name: body.name }
			}),
			invalidatesTags: [BUBLIK_TAG.Config, BUBLIK_TAG.Project]
		}),
		deleteProject: build.mutation<unknown, number>({
			query: (id) => ({
				url: withApiV2(`/projects/${id}`),
				method: 'DELETE'
			}),
			invalidatesTags: [BUBLIK_TAG.Config, BUBLIK_TAG.Project]
		}),
		updateProject: build.mutation<unknown, number>({
			query: (id) => ({
				url: withApiV2(`/projects/${id}`),
				method: 'PATCH'
			}),
			invalidatesTags: [BUBLIK_TAG.Config, BUBLIK_TAG.Project]
		}),
		getProject: build.query<Project, number>({
			query: (id) => ({ url: withApiV2(`/projects/${id}`) }),
			transformResponse: (v: ProjectResponse) => ({
				id: v.id,
				name: v.project_name
			}),
			providesTags: [BUBLIK_TAG.Project]
		})
	})
};
