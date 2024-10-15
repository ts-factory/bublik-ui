/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useEffect } from 'react';

import { bublikAPI, ConfigSchemaParams } from '@/services/bublik-api';
import { Icon, Skeleton } from '@/shared/tailwind-ui';

import { useConfigPageSearchParams } from '../hooks';
import { SidebarHeader } from './config-sidebar';
import { ConfigList } from './config-list.component';

function ConfigsSidebarContainer() {
	const configsQuery = bublikAPI.useGetListOfConfigsQuery();
	const { setConfigId, configId, setNewConfigParams } =
		useConfigPageSearchParams();
	const prefetchConfigById = bublikAPI.usePrefetch('getConfigById');
	const prefetchConfigVersions = bublikAPI.usePrefetch(
		'getAllVersionsOfConfigById'
	);
	const prefetchSchema = bublikAPI.usePrefetch('getConfigSchema');

	useEffect(() => {
		if (!configsQuery.data) return;

		configsQuery.data.forEach(({ id, type, name }) => {
			prefetchConfigById({ id });
			prefetchConfigVersions({ id });
			prefetchSchema({ type: 'report' });
			prefetchSchema({ type, name });
		});
	}, [
		configsQuery.data,
		prefetchConfigById,
		prefetchConfigVersions,
		prefetchSchema
	]);

	function handleCreateNewConfigClick(params: ConfigSchemaParams) {
		setConfigId(null);
		setNewConfigParams(params);
	}

	if (configsQuery.error) {
		return <div>Error...</div>;
	}

	if (configsQuery.isLoading) {
		return (
			<div className="flex flex-col h-full">
				<SidebarHeader
					onCreateNewConfigClick={handleCreateNewConfigClick}
					configId={configId}
				/>
				<Skeleton className="h-full" />
			</div>
		);
	}

	if (!configsQuery.data?.length || !configsQuery.data) {
		return (
			<div className="flex flex-col h-full">
				<SidebarHeader
					onCreateNewConfigClick={handleCreateNewConfigClick}
					configId={configId}
				/>
				<div className="flex-1 grid place-items-center">
					<div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
						<Icon
							name="SettingsSliders"
							className="size-12 mb-4 text-text-menu"
						/>
						<h3 className="text-lg font-semibold mb-2">
							No configurations yet
						</h3>
						<p className="text-sm text-text-menu mb-4">
							Create your first configuration to get started.
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full">
			<SidebarHeader
				onCreateNewConfigClick={handleCreateNewConfigClick}
				configId={configId}
			/>
			<ConfigList
				versions={configsQuery.data}
				isFetching={configsQuery.isFetching}
				currentConfigId={configId}
				onConfigClick={setConfigId}
			/>
		</div>
	);
}

export { ConfigsSidebarContainer };
