/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useMemo, useState } from 'react';
import { groupBy } from 'remeda';

import { ConfigItem, Project, ConfigSchemaParams } from '@/services/bublik-api';
import { cn, Icon } from '@/shared/tailwind-ui';

import { formatTimeV } from '../utils';
import { InactiveBadge } from '../components/badges.component';
import { DEFAULT_PROJECT_NAME } from '../constants';

type GroupedConfigs = { [key: string]: ConfigItem[] };

interface GroupState {
	[key: string]: boolean;
}

const REQUIRED_GLOBAL_CONFIGS = [
	{ type: 'global', name: 'per_conf' },
	{ type: 'global', name: 'references' }
] as const;

function getInitialGroupState(projects: Project[]) {
	const initialState: GroupState = {};

	[DEFAULT_PROJECT_NAME, ...projects.map((p) => p.name)].forEach(
		(projectName) => (initialState[projectName] = true)
	);

	return initialState;
}

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
		currentConfigId,
		isFetching,
		onConfigClick,
		onCreateNewConfigClick
	} = props;

	const [groupState, setGroupState] = useState<GroupState>(
		getInitialGroupState(projects)
	);

	const groupedByProject = useMemo(() => {
		const defaultConfigs = configs.filter((config) => !config.project);
		const projectConfigs = configs.filter((config) => config.project);
		const projectMap = new Map<number, string>();

		projects.forEach((project) => projectMap.set(project.id, project.name));

		const groupedByProject: GroupedConfigs = {
			Default: defaultConfigs,
			...Object.fromEntries(projects.map((project) => [project.name, []]))
		};

		Object.entries(
			groupBy(
				projectConfigs,
				(config) => projectMap.get(config.project || 0) || DEFAULT_PROJECT_NAME
			)
		).forEach(([projectName, configs]) => {
			if (projectName in groupedByProject) {
				groupedByProject[projectName] = configs;
			}
		});

		return groupedByProject;
	}, [configs, projects]);

	const toggleProject = (projectName: string) => {
		setGroupState((prev) => ({
			...prev,
			[projectName]: !prev[projectName]
		}));
	};

	return (
		<div
			className={cn('flex flex-col overflow-auto', isFetching && 'opacity-40')}
		>
			{Object.entries(groupedByProject).map(([projectName, projectConfigs]) => {
				const isProjectOpen = groupState[projectName];

				const sortedConfigs = [...projectConfigs].sort((a, b) => {
					if (a.type === 'global' && b.type !== 'global') return -1;
					if (a.type !== 'global' && b.type === 'global') return 1;
					return a.name.localeCompare(b.name);
				});

				const missingGlobalConfigs = REQUIRED_GLOBAL_CONFIGS.filter(
					(required) =>
						!sortedConfigs.some(
							(config) =>
								config.type === required.type && config.name === required.name
						)
				);

				const projectId =
					projectName !== DEFAULT_PROJECT_NAME
						? projects.find((p) => p.name === projectName)?.id
						: undefined;

				return (
					<div
						key={projectName}
						className={cn(
							'border-border-primary last:border-b-0',
							isProjectOpen && 'border-b'
						)}
					>
						<button
							onClick={() => toggleProject(projectName)}
							className="w-full flex items-center justify-between border-b border-border-primary px-4 py-2 hover:bg-primary-wash"
						>
							<div className="flex items-center gap-2">
								<Icon name="Folder" size={20} />
								<span className="font-semibold text-sm">{projectName}</span>
							</div>
							<Icon
								name={'ChevronDown'}
								size={18}
								className={cn('text-text-menu', isProjectOpen && 'rotate-180')}
							/>
						</button>

						{isProjectOpen && (
							<ul>
								{sortedConfigs.map((config) => (
									<ConfigListItem
										key={config.id}
										config={config}
										isActive={currentConfigId === config.id}
										onClick={onConfigClick}
									/>
								))}
								{missingGlobalConfigs.map((config) => (
									<GhostConfigItem
										key={`${config.type}-${config.name}`}
										type={config.type}
										name={config.name}
										onClick={() =>
											onCreateNewConfigClick?.({
												type: config.type,
												name: config.name,
												project: projectId
											})
										}
									/>
								))}
							</ul>
						)}
					</div>
				);
			})}
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
