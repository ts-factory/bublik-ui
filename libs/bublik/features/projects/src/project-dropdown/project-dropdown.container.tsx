/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useState } from 'react';
import { useLocation, useMatch, useNavigate } from 'react-router-dom';

import { bublikAPI } from '@/services/bublik-api';
import { usePhysicalHotkeys } from '@/shared/hooks';
import { useSidebar } from '@/shared/tailwind-ui';

import { CreateProjectModal } from '../create-project-modal';
import { useProjectSearch } from '../hooks';
import { mergeStringUrlWithSidebarState } from '../lib/sidebar-params.utils';
import { ProjectSwitcher } from './project-switcher.component';
import { ProjectLastRunContainer } from './project-last-run.container';

interface ProjectPickerContainerProps {
	/** Shows the New Project and Manage actions; the app passes `isAdmin`. */
	canManage?: boolean;
}

function ProjectPickerContainer({
	canManage = false
}: ProjectPickerContainerProps) {
	const { isSidebarOpen = false } = useSidebar();
	const {
		data: projects,
		isLoading,
		error
	} = bublikAPI.useGetAllProjectsQuery();
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState('');
	// Outside the popover: closing it would unmount a dialog opened inside.
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const { projectIds, setProjectsIds } = useProjectSearch();
	const navigate = useNavigate();
	const location = useLocation();
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
		<>
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
				actions={
					canManage
						? {
								onCreateProject: () => {
									handleOpenChange(false);
									setIsCreateOpen(true);
								},
								onManage: () => handleOpenChange(false)
						  }
						: undefined
				}
			/>
			{canManage ? (
				<CreateProjectModal
					open={isCreateOpen}
					onOpenChange={setIsCreateOpen}
					// A new project has no configs yet: open them, scoped to it
					onCreated={(project) =>
						navigate(
							mergeStringUrlWithSidebarState(
								'/admin/config',
								new URLSearchParams(location.search),
								[project.id]
							)
						)
					}
				/>
			) : null}
		</>
	);
}

export { ProjectPickerContainer };
