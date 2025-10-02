/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { EndpointBuilder } from '@reduxjs/toolkit/query';
import { z } from 'zod';

import { BublikBaseQueryFn, withApiV2 } from '../config';
import { BUBLIK_TAG } from '../types';
import { API_REDUCER_PATH } from '../constants';

const ConfigParamsSchema = z.object({
	id: z.number()
});

type ConfigParams = z.infer<typeof ConfigParamsSchema>;

const CreateConfigBodySchema = z.object({
	type: z.string(),
	name: z.string().min(1),
	description: z.string().optional(),
	is_active: z.boolean(),
	content: z.any(),
	project: z.number().optional().nullable()
});

export const ConfigSchemaParamsSchema = z
	.object({
		type: z.string(),
		name: z.string().min(1).optional(),
		project: z.number().optional().nullable()
	})
	.or(z.object({ type: z.string() }));

export type ConfigSchemaParams = z.infer<typeof ConfigSchemaParamsSchema>;

type CreateConfigParams = z.infer<typeof CreateConfigBodySchema>;

const EditConfigBodySchema = z.object({
	name: z.string().optional(),
	description: z.string().optional(),
	content: z.string().optional(),
	is_active: z.boolean().optional()
});

export type EditConfigBody = z.infer<typeof EditConfigBodySchema>;

const EditConfigByIdParamsSchema = z.object({
	id: z.number(),
	body: EditConfigBodySchema.optional()
});

type EditConfigByIdParams = z.infer<typeof EditConfigByIdParamsSchema>;

const ConfigListResponseSchema = z.object({
	id: z.number(),
	type: z.string(),
	name: z.string(),
	description: z.string(),
	is_active: z.boolean(),
	created: z.string(),
	version: z.number(),
	project: z.number().optional()
});

export type ConfigItem = z.infer<typeof ConfigListResponseSchema>;

const ConfigSchema = z.object({
	created: z.string(),
	type: z.string(),
	name: z.string(),
	id: z.number(),
	version: z.number(),
	is_active: z.boolean(),
	description: z.string(),
	user: z.number(),
	project: z.number().optional(),
	content: z.record(z.unknown())
});

type Config = z.infer<typeof ConfigSchema>;

const ConfigVersionSchema = z.object({
	type: z.string(),
	name: z.string(),
	all_config_versions: z.array(
		z.object({
			id: z.number(),
			is_active: z.boolean(),
			description: z.string(),
			created: z.string(),
			version: z.number()
		})
	)
});

export type ConfigVersionResponse = z.infer<typeof ConfigVersionSchema>;

export const ConfigExistsErrorResponseSchema = z.object({
	data: z.object({ id: z.number() }).nonstrict(),
	status: z.number()
});

export const ConfigWithSameNameErrorResponseSchema = z.object({
	data: z.object({ message: z.string(), type: z.literal('ValueError') }),
	status: z.number()
});

export const ConfigValidationErrorSchema = z.object({
	status: z.number(),
	data: z.object({
		type: z.string(),
		message: z.record(z.array(z.string())).or(z.string())
	})
});

const ConfigTypesResponseSchema = z.object({
	config_types_names: z.array(
		z.object({
			type: z.string(),
			name: z.string(),
			required: z.boolean(),
			description: z.string()
		})
	)
});

export type ConfigTypesResponse = z.infer<typeof ConfigTypesResponseSchema>;

export class ConfigExistsError extends Error {
	constructor(public readonly configId: number) {
		super(`Config already exists. Id: ${configId}`);
	}
}

function transformConfigError(response: unknown) {
	const result = ConfigExistsErrorResponseSchema.safeParse(response);

	if (result.success) {
		return new ConfigExistsError(result.data.data.id);
	}

	return response;
}

export const configsEndpoints = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		getListOfConfigs: build.query<ConfigItem[], void>({
			query: () => ({ url: withApiV2('/config'), cache: 'no-cache' }),
			providesTags: [BUBLIK_TAG.Config]
		}),
		getConfigById: build.query<Config, ConfigParams>({
			query: (params) => ({
				url: withApiV2(`/config/${params.id}`),
				cache: 'no-cache'
			}),
			providesTags: [BUBLIK_TAG.Config]
		}),
		getConfigSchema: build.query<Record<string, unknown>, ConfigSchemaParams>({
			query: (params) => ({
				url: withApiV2(
					`/config/schema/?${new URLSearchParams(
						Object.fromEntries(
							Object.entries(params).map(([key, value]) => [key, String(value)])
						)
					).toString()}`,
					true
				)
			}),
			providesTags: [BUBLIK_TAG.Config]
		}),
		getAllVersionsOfConfigById: build.query<
			ConfigVersionResponse,
			ConfigParams
		>({
			query: (params) => ({
				url: withApiV2(`/config/${params.id}/all_versions`),
				cache: 'no-cache'
			}),
			providesTags: [BUBLIK_TAG.Config]
		}),
		createConfig: build.mutation<Config, CreateConfigParams>({
			query: (params) => ({
				url: withApiV2('/config'),
				method: 'POST',
				body: { ...params, project: params.project ?? null }
			}),
			transformErrorResponse: transformConfigError,
			invalidatesTags: [BUBLIK_TAG.Config]
		}),
		editConfigById: build.mutation<Config, EditConfigByIdParams>({
			query: (params) => ({
				url: withApiV2(`/config/${params.id}`),
				body: params.body,
				method: 'PATCH'
			}),
			transformErrorResponse: transformConfigError,
			invalidatesTags: [BUBLIK_TAG.Config]
		}),
		deleteConfigById: build.mutation<void, number>({
			query: (configId) => ({
				url: withApiV2(`/config/${configId}`),
				method: 'DELETE'
			}),
			invalidatesTags: [BUBLIK_TAG.Config]
		}),
		getConfigTypes: build.query<ConfigTypesResponse, void>({
			query: () => ({ url: withApiV2('/config/available_types_names') })
		})
	})
};
