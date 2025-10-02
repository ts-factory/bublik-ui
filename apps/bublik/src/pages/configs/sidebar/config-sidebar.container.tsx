/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { ReactNode, useEffect } from 'react';

import { Skeleton } from '@/shared/tailwind-ui';
import { bublikAPI, ConfigSchemaParams } from '@/services/bublik-api';
import { useAuth } from '@/bublik/features/auth';
import { useProjectSearch } from '@/bublik/features/projects';

import { useConfigPageSearchParams } from '../hooks';
import { SidebarHeader } from './config-sidebar';
import { ConfigList } from './config-list.component';

interface ConfigsSidebarContainerProps {
	createProjectButton?: ReactNode;
}

function ConfigsSidebarContainer(props: ConfigsSidebarContainerProps) {
	const { createProjectButton } = props;
	const { projectIds } = useProjectSearch();
	const configsQuery = bublikAPI.useGetListOfConfigsQuery(
		{ projectIds: projectIds },
		{ refetchOnMountOrArgChange: true }
	);
	const projectsQuery = bublikAPI.useGetAllProjectsQuery();
	const { isAdmin } = useAuth();
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

	return (
		<div className="flex flex-col h-full">
			<SidebarHeader
				onCreateNewConfigClick={handleCreateNewConfigClick}
				configId={configId}
				createProjectButton={createProjectButton}
				isAdmin={isAdmin}
			/>
			<ConfigList
				configs={configsQuery.data}
				projects={projectsQuery.data}
				projectIds={projectIds}
				isFetching={configsQuery.isFetching || projectsQuery.isFetching}
				currentConfigId={configId}
				onConfigClick={setConfigId}
				onCreateNewConfigClick={handleCreateNewConfigClick}
			/>
		</div>
	);
}

export { ConfigsSidebarContainer };
