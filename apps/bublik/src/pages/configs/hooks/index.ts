/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { Monaco } from '@monaco-editor/react';
import { MutableRefObject, useCallback } from 'react';
import { useQueryParam, NumberParam, JsonParam } from 'use-query-params';
import { useSessionStorage, useUnmount } from 'react-use';
import { useBeforeUnload } from 'react-router-dom';
import { skipToken } from '@reduxjs/toolkit/query';

import {
	bublikAPI,
	ConfigExistsError,
	ConfigSchemaParams,
	ConfigSchemaParamsSchema,
	EditConfigBody
} from '@/services/bublik-api';
import { toast } from '@/shared/tailwind-ui';

import { getEditorValue, ValidationErrorSchema } from '../utils';

function useConfigPageSearchParams() {
	const [configId, _setConfigId] = useQueryParam('configId', NumberParam);
	const [_newConfigParams, setNewConfigParams] =
		useQueryParam<ConfigSchemaParams | null>('new_config', JsonParam);

	function setConfigId(configId: number | null) {
		setNewConfigParams(null);
		_setConfigId(configId);
	}

	const newConfigParams = ConfigSchemaParamsSchema.safeParse(_newConfigParams)
		.success
		? ConfigSchemaParamsSchema.parse(_newConfigParams)
		: null;

	return { configId, setConfigId, newConfigParams, setNewConfigParams };
}

function useSavedState(
	key: string,
	editorRef?: MutableRefObject<Monaco | undefined>
) {
	const [savedValue, setSavedValue] = useSessionStorage<string>(key);

	const handleBeforeUnload = useCallback(() => {
		const value = getEditorValue(editorRef?.current);
		if (!value) return;
		setSavedValue(value);
	}, [editorRef, setSavedValue]);

	useBeforeUnload(handleBeforeUnload);
	useUnmount(handleBeforeUnload);

	return { savedValue, setSavedValue };
}

function useConfigById(configId: number) {
	const configQuery = bublikAPI.useGetConfigByIdQuery({ id: configId });
	const versionsQuery = bublikAPI.useGetAllVersionsOfConfigByIdQuery({
		id: configId
	});
	const schemaQuery = bublikAPI.useGetConfigSchemaQuery(
		configQuery.data
			? { name: configQuery.data.name, type: configQuery.data.type }
			: skipToken
	);
	const [deleteMutation] = bublikAPI.useDeleteConfigByIdMutation();
	const [editMutation] = bublikAPI.useEditConfigByIdMutation();

	async function deleteConfig(id: number) {
		const promise = deleteMutation(id).unwrap();
		toast.promise(promise, {
			success: 'Succesfully deleted config',
			error: 'Failed to delete config',
			loading: 'Deleting config...'
		});
	}

	function updateConfig(params: EditConfigBody) {
		const promise = editMutation({ id: configId, body: params }).unwrap();

		toast.promise(promise, {
			success: 'Succesfully updated config',
			error: (e) => {
				if (e instanceof ConfigExistsError) return e.message;

				try {
					const {
						data: { message }
					} = ValidationErrorSchema.parse(e);
					const errorMessage = Object.entries(message)
						.map(([key, error]) => `${key}: ${error}`)
						.flat()
						.join('\n');

					return errorMessage;
				} catch (parseError) {
					console.error(parseError);
				}

				return 'Failed to update config';
			},
			loading: 'Updating config...'
		});

		return promise;
	}

	function markAsCurrent(params: EditConfigBody) {
		const promise = editMutation({ id: configId, body: params }).unwrap();
		toast.promise(promise, {
			success: 'Succesfully activated config',
			error: 'Failed to activate config',
			loading: 'Activating config...'
		});
	}

	return {
		isLoading:
			configQuery.isLoading || versionsQuery.isLoading || schemaQuery.isLoading,
		error: configQuery.error || versionsQuery.error || schemaQuery.error,
		isFetching:
			configQuery.isFetching ||
			versionsQuery.isFetching ||
			schemaQuery.isFetching,
		config: configQuery.data,
		versions: versionsQuery.data,
		schema: schemaQuery.data,
		deleteConfig,
		updateConfig,
		markAsCurrent
	};
}

function useShouldMigrateGlobalConfig() {
	const { data, isLoading, error } = bublikAPI.useGetListOfConfigsQuery();
	const [mutate] = bublikAPI.useMigrateGlobalConfigMutation();
	const { setConfigId } = useConfigPageSearchParams();

	const shouldMigrate = !data?.find(
		(config) => config.name === 'per_conf' && config.type === 'global'
	);

	async function migrateGlobalConfig() {
		try {
			const promise = mutate().unwrap();

			toast.promise(promise, {
				error: 'Failed to migrate config.',
				success: 'Succesfully migrated config',
				loading: 'Migrating global config...'
			});
			const result = await promise;
			setConfigId(result.id);
		} catch (_) {
			//
		}
	}

	return { shouldMigrate, isLoading, error, migrateGlobalConfig };
}

export {
	useConfigPageSearchParams,
	useSavedState,
	useConfigById,
	useShouldMigrateGlobalConfig
};
