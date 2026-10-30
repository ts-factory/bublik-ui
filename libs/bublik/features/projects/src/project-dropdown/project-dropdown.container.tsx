/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useState } from 'react';
import { useMatch } from 'react-router-dom';

import { bublikAPI } from '@/services/bublik-api';
import { usePhysicalHotkeys } from '@/shared/hooks';
import { useSidebar } from '@/shared/tailwind-ui';

import { useProjectSearch } from '../hooks';
import { ProjectSwitcher } from './project-switcher.component';
import { ProjectLastRunContainer } from './project-last-run.container';

function ProjectPickerContainer() {
	const { isSidebarOpen = false } = useSidebar();
	const {
		data: projects,
		isLoading,
		error
	} = bublikAPI.useGetAllProjectsQuery();
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState('');
	const { projectIds, setProjectsIds } = useProjectSearch();
	// The run report already takes P to toggle its pair-gain columns.
	const isRunReport = useMatch('/runs/:runId/report') !== null;

	usePhysicalHotkeys(
		[
			{
				code: 'KeyP',
				callback: () => setIsOpen(true),
				options: { enabled: Boolean(projects?.length) && !isRunReport }
			}
		],
		{ ignoreInputs: true, preventDefault: true, requireReset: true }
	);

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) setSearch('');
	};

	const handleSelect = (projectId: number | undefined) => {
		setProjectsIds(typeof projectId === 'undefined' ? [] : [projectId]);
		handleOpenChange(false);
	};

	if (isLoading) return null;

	if (error) return null;

	if (!projects?.length) return null;

	const currentProject = projects.find(
		(project) => project.id === projectIds.at(0)
	);

	return (
		<ProjectSwitcher
			projects={projects}
			currentProject={currentProject}
			isOpen={isOpen}
			onOpenChange={handleOpenChange}
			search={search}
			onSearchChange={setSearch}
			onSelect={handleSelect}
			isSidebarOpen={isSidebarOpen}
			renderMeta={(projectId) => (
				<ProjectLastRunContainer projectId={projectId} />
			)}
		/>
	);
}

export { ProjectPickerContainer };
