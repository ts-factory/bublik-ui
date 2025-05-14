import { EndpointBuilder } from '@reduxjs/toolkit/query';
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
				url: withApiV2('/projects'),
				cache: 'no-cache'
			}),
			transformResponse: (v: ProjectResponse[]) =>
				v.map((v) => ({ id: v.id, name: v.project_name })),
			providesTags: [BUBLIK_TAG.Project]
		}),
		createProject: build.mutation<Project, CreateProject>({
			query: (body) => ({
				url: withApiV2(`/projects`),
				method: 'POST',
				body: { project_name: body.name },
				cache: 'no-cache'
			}),
			invalidatesTags: [BUBLIK_TAG.Config, BUBLIK_TAG.Project]
		}),
		deleteProject: build.mutation<unknown, number>({
			query: (id) => ({
				url: withApiV2(`/projects/${id}`),
				method: 'DELETE',
				cache: 'no-cache'
			}),
			invalidatesTags: [BUBLIK_TAG.Config, BUBLIK_TAG.Project]
		}),
		updateProject: build.mutation<unknown, { id: number; name: string }>({
			query: ({ id, name }) => ({
				url: withApiV2(`/projects/${id}`),
				method: 'PATCH',
				body: { project_name: name },
				cache: 'no-cache'
			}),
			invalidatesTags: [BUBLIK_TAG.Config, BUBLIK_TAG.Project]
		}),
		getProject: build.query<Project, number>({
			query: (id) => ({
				url: withApiV2(`/projects/${id}`),
				cache: 'no-cache'
			}),
			transformResponse: (v: ProjectResponse) => ({
				id: v.id,
				name: v.project_name
			}),
			providesTags: [BUBLIK_TAG.Project]
		})
	})
};
