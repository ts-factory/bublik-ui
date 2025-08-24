/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useMemo, useState } from 'react';
import { groupBy } from 'remeda';

import { ConfigItem, Project, ConfigSchemaParams } from '@/services/bublik-api';
import { cn, ConfirmDialog, Icon } from '@/shared/tailwind-ui';
import {
	useDeleteProject,
	UpdateProjectModal
} from '@/bublik/features/projects';
import { useConfirm } from '@/shared/hooks';

import { formatTimeV } from '../utils';
import { InactiveBadge } from '../components/badges.component';
import { DEFAULT_PROJECT_LABEL } from '../config.constants';

type GroupedConfigs = { [key: string]: ConfigItem[] };

const REQUIRED_GLOBAL_CONFIGS = [
	{ type: 'global', name: 'per_conf' },
	{ type: 'global', name: 'references' }
];

interface ConfigListProps {
	configs?: ConfigItem[];
	projects?: Project[];
	isFetching?: boolean;
	currentConfigId?: number | null;
	onConfigClick?: (id: number) => void;
	onCreateNewConfigClick?: (params: ConfigSchemaParams) => void;
}

function ConfigList(props: ConfigListProps) {
	const {
		configs = [],
		projects = [],
		isFetching,
		currentConfigId,
		onConfigClick,
		onCreateNewConfigClick
	} = props;

	const groupedByProject = useMemo(() => {
		const defaultConfigs = configs.filter((config) => !config.project);
		const projectConfigs = configs.filter((config) => config.project);
		const projectMap = new Map<number, string>();

		projects.forEach((project) => projectMap.set(project.id, project.name));

		const groupedByProject: GroupedConfigs = {
			[DEFAULT_PROJECT_LABEL]: defaultConfigs,
			...Object.fromEntries(projects.map((project) => [project.name, []]))
		};

		Object.entries(
			groupBy(
				projectConfigs,
				(config) => projectMap.get(config.project || 0) || DEFAULT_PROJECT_LABEL
			)
		).forEach(([projectName, configs]) => {
			if (projectName in groupedByProject) {
				groupedByProject[projectName] = configs;
			}
		});

		return groupedByProject;
	}, [configs, projects]);

	return (
		<div
			className={cn('flex flex-col overflow-auto', isFetching && 'opacity-40')}
		>
			{Object.entries(groupedByProject).map(([projectName, projectConfigs]) => {
				const sortedConfigs = [...projectConfigs].sort((a, b) => {
					if (a.type === 'global' && b.type !== 'global') return -1;
					if (a.type !== 'global' && b.type === 'global') return 1;
					return a.name.localeCompare(b.name);
				});

				const missingGlobalConfigs: typeof REQUIRED_GLOBAL_CONFIGS = [];

				const foundProject =
					projectName !== DEFAULT_PROJECT_LABEL
						? projects.find((p) => p.name === projectName)
						: undefined;

				const key = foundProject ? foundProject.id : 'default';

				return (
					<ProjectCard
						key={key}
						id={foundProject?.id ?? null}
						name={projectName}
						configs={sortedConfigs}
						missingConfigs={missingGlobalConfigs}
						activeConfigId={currentConfigId}
						onConfigClick={onConfigClick}
						onCreateNewConfigClick={onCreateNewConfigClick}
					/>
				);
			})}
		</div>
	);
}

interface ProjectCardProps {
	id: number | null;
	name: string;
	configs: ConfigItem[];
	missingConfigs: typeof REQUIRED_GLOBAL_CONFIGS;
	onConfigClick?: (id: number) => void;
	onCreateNewConfigClick?: (params: ConfigSchemaParams) => void;
	activeConfigId?: number | null;
}

function ProjectCard(props: ProjectCardProps) {
	const {
		id,
		name,
		configs,
		missingConfigs,
		onConfigClick,
		onCreateNewConfigClick,
		activeConfigId
	} = props;
	const [open, setOpen] = useState(true);
	const { confirmation, confirm, decline, isVisible } = useConfirm();
	const { deleteProject: _deleteProject } = useDeleteProject({ id });

	async function deleteProject() {
		const isConfirmed = await confirmation();
		if (!isConfirmed) return;
		_deleteProject();
	}

	return (
		<div
			className={cn(
				'grid border-border-primary last:border-b-0',
				open && 'border-b'
			)}
		>
			<ConfirmDialog
				open={isVisible}
				title="Delete Project"
				description="Do you want to delete project?"
				onCancelClick={decline}
				onConfirmClick={confirm}
			/>
			<div className="w-full flex items-center border-b border-border-primary hover:bg-primary-wash">
				<button
					className="flex items-center gap-2 flex-1 px-4 py-2"
					onClick={() => setOpen((v) => !v)}
				>
					<Icon name="Folder" size={20} />
					<span className="font-semibold text-sm">{name}</span>
				</button>
				<div className="flex items-center gap-0.5">
					{id ? (
						<>
							<UpdateProjectModal projectId={id} projectName={name}>
								<button
									className={cn(
										'flex items-center justify-center transition-all appearance-none select-none text-primary hover:bg-primary-wash disabled:shadow-[inset_0_0_0_1px_hsl(var(--colors-border-primary))] disabled:bg-white disabled:hover:bg-white disabled:text-border-primary text-[0.6875rem] font-semibold leading-[0.875rem] max-h-[26px] rounded-md hover:shadow-[inset_0_0_0_2px_#94b0ff] p-1',
										'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
									)}
								>
									<Icon name="Edit" size={18} />
								</button>
							</UpdateProjectModal>
							<button
								className="flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all appearance-none select-none text-text-unexpected hover:bg-red-100 disabled:shadow-[inset_0_0_0_1px_hsl(var(--colors-border-primary))] disabled:bg-white disabled:hover:bg-white disabled:text-text-menu p-1 text-[0.6875rem] font-semibold leading-[0.875rem] max-h-[26px] rounded-md"
								onClick={deleteProject}
							>
								<Icon name="Bin" size={18} />
							</button>
						</>
					) : null}
					<button className="pr-4 py-2" onClick={() => setOpen((v) => !v)}>
						<Icon
							name={'ChevronDown'}
							size={18}
							className={cn('text-text-menu', open && 'rotate-180')}
						/>
					</button>
				</div>
			</div>

			<div
				className={cn(
					'[&_ul]:overflow-hidden grid transition-all transform-gpu ease-in-out motion-reduce:transition-none duration-500',
					open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
				)}
			>
				<ul>
					{configs.length === 0 ? (
						<li className="min-h-16 flex flex-col border-b border-dashed border-border-primary last:border-b-0">
							<div className="grid place-items-center gap-1 px-2.5 py-2 text-xs w-full h-full flex-1 opacity-50">
								<p className="text-xs w-full text-center font-semibold flex-1 overflow-wrap-anywhere">
									No configurations found for this project
								</p>
							</div>
						</li>
					) : (
						<>
							{configs.map((config) => (
								<ConfigListItem
									key={config.id}
									config={config}
									isActive={activeConfigId === config.id}
									onClick={onConfigClick}
								/>
							))}
							{missingConfigs.map((config) => {
								return (
									<GhostConfigItem
										key={`${config.type}-${config.name}`}
										type={config.type}
										name={config.name}
										onClick={() =>
											onCreateNewConfigClick?.({
												type: config.type,
												name: config.name,
												project: id
											})
										}
									/>
								);
							})}
						</>
					)}
				</ul>
			</div>
		</div>
	);
}

interface ConfigListItemProps {
	config: ConfigItem;
	isActive?: boolean;
	onClick?: (id: number) => void;
}

interface GhostConfigItemProps {
	type: string;
	name: string;
	onClick?: () => void;
}

function GhostConfigItem({ type, name, onClick }: GhostConfigItemProps) {
	return (
		<li className="min-h-16 flex flex-col border-b border-dashed border-border-primary last:border-b-0">
			<button
				className="hover:bg-primary-wash rounded flex flex-col gap-1 px-2.5 py-2 text-xs w-full h-full flex-1 opacity-50"
				onClick={onClick}
			>
				<div className="flex items-center justify-between gap-2 w-full">
					<div className="flex items-center gap-2">
						<Icon name="AddSymbol" size={16} />
						<span className="font-semibold text-xs whitespace-nowrap truncate">
							Create {name}
						</span>
					</div>
				</div>
				<p className="text-xs w-full text-left flex-1 overflow-wrap-anywhere">
					Click to create required {type} configuration
				</p>
			</button>
		</li>
	);
}

function ConfigListItem({ config, isActive, onClick }: ConfigListItemProps) {
	return (
		<li key={config.id} className="min-h-16 flex flex-col">
			<button
				className={cn(
					'hover:bg-primary-wash rounded flex flex-col gap-1 px-2.5 py-2 text-xs w-full h-full flex-1',
					isActive && 'bg-primary-wash'
				)}
				onClick={() => onClick?.(config.id)}
			>
				<div className="flex items-center justify-between gap-2 w-full">
					<div className="flex items-center gap-2">
						<span className="font-semibold text-xs whitespace-nowrap truncate">
							{config.name} #{config.version}
						</span>
						{!config.is_active ? <InactiveBadge /> : null}
					</div>
					<span className="text-slate-500 text-xs whitespace-nowrap">
						{formatTimeV(config.created)}
					</span>
				</div>
				<p className="text-xs w-full text-left flex-1 overflow-wrap-anywhere">
					{config.description}
				</p>
			</button>
		</li>
	);
}

export { ConfigList };
