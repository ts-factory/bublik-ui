/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useState } from 'react';
import { groupBy } from 'remeda';

import { ConfigItem, Project } from '@/services/bublik-api';
import { cn, Icon } from '@/shared/tailwind-ui';
import { upperCaseFirstLetter } from '@/shared/utils';

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
	[key: string]: {
		isOpen: boolean;
		types: { [key: string]: boolean };
	};
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
			initialState[projectName] = {
				isOpen: true,
				types: { global: true, report: true }
			};
		});
		return initialState;
	});

	const projectMap = new Map<number, string>();
	projects.forEach((project) => {
		projectMap.set(project.id, project.name);
	});

	const groupedByProject = groupBy(configs, (config) => {
		if (!config.project) return 'Default';

		return projectMap.get(config.project) || 'Default';
	});

	const toggleProject = (projectName: string) => {
		setGroupState((prev) => ({
			...prev,
			[projectName]: {
				...prev[projectName],
				isOpen: !prev[projectName].isOpen
			}
		}));
	};

	const toggleType = (projectName: string, type: string) => {
		setGroupState((prev) => ({
			...prev,
			[projectName]: {
				...prev[projectName],
				types: {
					...prev[projectName].types,
					[type]: !prev[projectName].types[type]
				}
			}
		}));
	};

	return (
		<ul
			className={cn('flex flex-col overflow-auto', isFetching && 'opacity-40')}
		>
			{Object.entries(groupedByProject).map(([projectName, projectConfigs]) => {
				const groupedByType = groupBy(
					[...projectConfigs].sort((a) => (a.type === 'global' ? -1 : 1)),
					(config) => config.type
				);

				const isProjectOpen = groupState[projectName]?.isOpen;

				return (
					<div
						key={projectName}
						className="border-b border-gray-200 last:border-b-0"
					>
						<button
							onClick={() => toggleProject(projectName)}
							className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50"
						>
							<span className="font-semibold text-sm">{projectName}</span>
							<Icon
								name={isProjectOpen ? 'ChevronDown' : 'ChevronDown'}
								size={20}
								className="text-gray-500"
							/>
						</button>

						{isProjectOpen && (
							<div className="pl-2">
								{Object.entries(groupedByType).map(([type, configs]) => {
									const isTypeOpen = groupState[projectName]?.types[type];

									return (
										<div key={type} className="border-l border-gray-200">
											<button
												onClick={() => toggleType(projectName, type)}
												className="flex items-center justify-between w-full px-4 py-1.5 hover:bg-gray-50"
											>
												<span className="text-sm font-medium">
													{upperCaseFirstLetter(type)}
												</span>
												<Icon
													name={isTypeOpen ? 'ChevronDown' : 'ChevronDown'}
													size={16}
													className="text-gray-500"
												/>
											</button>

											{isTypeOpen && (
												<div>
													{configs.map((config) => (
														<ConfigListItem
															key={config.id}
															config={config}
															isActive={currentConfigId === config.id}
															onClick={onConfigClick}
														/>
													))}
												</div>
											)}
										</div>
									);
								})}
							</div>
						)}
					</div>
				);
			})}
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
