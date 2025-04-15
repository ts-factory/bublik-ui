/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useState } from 'react';
import { groupBy } from 'remeda';

import { ConfigItem, Project } from '@/services/bublik-api';
import { cn, Icon } from '@/shared/tailwind-ui';

import { formatTimeV } from '../utils';
import { InactiveBadge } from '../components/badges.component';

interface ConfigListProps {
	configs?: ConfigItem[];
	projects?: Project[];
	isFetching?: boolean;
	currentConfigId?: number | null;
	onConfigClick?: (id: number) => void;
}

interface GroupState {
	[key: string]: boolean;
}

function ConfigList(props: ConfigListProps) {
	const {
		configs = [],
		projects = [],
		currentConfigId,
		isFetching,
		onConfigClick
	} = props;

	const [groupState, setGroupState] = useState<GroupState>(() => {
		const initialState: GroupState = {};
		['Default', ...projects.map((p) => p.name)].forEach((projectName) => {
			initialState[projectName] = true;
		});
		return initialState;
	});

	const projectMap = new Map<number, string>();
	projects.forEach((project) => {
		projectMap.set(project.id, project.name);
	});

	const defaultConfigs = configs.filter((config) => !config.project);
	const projectConfigs = configs.filter((config) => config.project);

	const groupedByProject = {
		Default: defaultConfigs,
		...groupBy(projectConfigs, (config) => {
			return projectMap.get(config.project || 0) || 'Default';
		})
	};

	const toggleProject = (projectName: string) => {
		setGroupState((prev) => ({
			...prev,
			[projectName]: !prev[projectName]
		}));
	};

	return (
		<ul
			className={cn('flex flex-col overflow-auto', isFetching && 'opacity-40')}
		>
			{Object.entries(groupedByProject).map(
				([projectName, projectConfigs], idx, arr) => {
					const isProjectOpen = groupState[projectName];

					// Sort configs: global first, then by name
					const sortedConfigs = [...projectConfigs].sort((a, b) => {
						if (a.type === 'global' && b.type !== 'global') return -1;
						if (a.type !== 'global' && b.type === 'global') return 1;
						return a.name.localeCompare(b.name);
					});

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
									className={cn(
										'text-text-menu',
										isProjectOpen && 'rotate-180'
									)}
								/>
							</button>

							{isProjectOpen && (
								<>
									{sortedConfigs.map((config) => (
										<ConfigListItem
											key={config.id}
											config={config}
											isActive={currentConfigId === config.id}
											onClick={onConfigClick}
										/>
									))}
								</>
							)}
						</div>
					);
				}
			)}
		</ul>
	);
}

interface ConfigListItemProps {
	config: ConfigItem;
	isActive?: boolean;
	onClick?: (id: number) => void;
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
