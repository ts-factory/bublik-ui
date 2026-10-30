/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ComponentPropsWithoutRef, ReactNode, forwardRef } from 'react';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';

import type { Project } from '@/services/bublik-api';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Icon,
	Kbd,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	cn,
	sidebarPaddingTransition
} from '@/shared/tailwind-ui';

import { getProjectTileStyle } from './project-switcher.utils';

const ALL_PROJECTS_LABEL = 'All projects';

interface ProjectTileProps {
	project?: Project;
}

function ProjectTile({ project }: ProjectTileProps) {
	const { initial, className } = getProjectTileStyle(project);

	return (
		<span
			aria-hidden="true"
			className={cn(
				'grid size-7 flex-shrink-0 place-items-center rounded-[7px] text-xs font-bold',
				className
			)}
		>
			{initial}
		</span>
	);
}

type ProjectLastRunProps =
	| { state: 'loading' | 'error' | 'empty' }
	| { state: 'ready'; age: string; runCount: number; dotClassName: string };

const lastRunStyles =
	'flex items-center gap-1.5 text-[0.6875rem] leading-[0.875rem] font-normal text-text-menu whitespace-nowrap';

function LastRunDot({ className }: { className: string }) {
	return (
		<span
			aria-hidden="true"
			className={cn('size-[7px] flex-shrink-0 rounded-full', className)}
		/>
	);
}

function ProjectLastRun(props: ProjectLastRunProps) {
	switch (props.state) {
		case 'error':
			return null;
		case 'loading':
			return (
				<span className="flex h-3.5 items-center">
					<span className="h-2 w-32 rounded-full bg-border-primary animate-pulse" />
				</span>
			);
		case 'empty':
			return (
				<span className={lastRunStyles} data-testid="project-picker-last-run">
					<LastRunDot className="bg-bg-compromised" />
					No runs yet
				</span>
			);
		case 'ready':
			return (
				<span className={lastRunStyles} data-testid="project-picker-last-run">
					<LastRunDot className={props.dotClassName} />
					<span className="truncate">
						Last run {props.age} ago · {props.runCount.toLocaleString('en-US')}{' '}
						{props.runCount === 1 ? 'run' : 'runs'}
					</span>
				</span>
			);
	}
}

interface ProjectOptionProps {
	project?: Project;
	value: string;
	testId: string;
	isCurrent: boolean;
	meta: ReactNode;
	onSelect: () => void;
}

function ProjectOption(props: ProjectOptionProps) {
	const { project, value, testId, isCurrent, meta, onSelect } = props;

	return (
		<CommandItem
			value={value}
			onSelect={onSelect}
			data-testid={testId}
			data-project-id={project ? project.id : 'all'}
			data-current={isCurrent}
			className={cn(
				'gap-2.5 rounded-lg px-2.5 py-[7px] cursor-pointer text-text-primary',
				'data-[selected=true]:text-text-primary',
				isCurrent && 'bg-bg-selected data-[selected=true]:bg-bg-selected'
			)}
		>
			<ProjectTile project={project} />
			<span className="flex min-w-0 flex-1 flex-col">
				<span className="truncate text-[0.8125rem] leading-[1.125rem] font-semibold">
					{project ? project.name : ALL_PROJECTS_LABEL}
				</span>
				{meta}
			</span>
			{isCurrent ? (
				<CheckIcon
					role="img"
					aria-label="Current project"
					className="size-[18px] flex-shrink-0 text-text-selected"
				/>
			) : null}
		</CommandItem>
	);
}

const groupStyles = cn(
	'p-0',
	'[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1',
	'[&_[cmdk-group-heading]]:text-[0.6875rem] [&_[cmdk-group-heading]]:leading-[0.875rem]',
	'[&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.06em]'
);

interface ProjectSwitcherTriggerProps
	extends ComponentPropsWithoutRef<'button'> {
	project?: Project;
	isOpen: boolean;
	isSidebarOpen: boolean;
}

const ProjectSwitcherTrigger = forwardRef<
	HTMLButtonElement,
	ProjectSwitcherTriggerProps
>(function ProjectSwitcherTrigger(props, ref) {
	const { project, isOpen, isSidebarOpen, className, ...rest } = props;

	return (
		<button
			{...rest}
			ref={ref}
			type="button"
			aria-label="Switch project"
			data-testid="project-picker-trigger"
			style={sidebarPaddingTransition}
			className={cn(
				// The Sign In button's box, so the sidebar's two cards line up
				'flex h-[42px] w-full min-w-0 items-center gap-3 rounded-[0.625rem] border pr-[15px] text-left',
				'hover:bg-primary-wash hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
				isSidebarOpen ? 'pl-[15px]' : 'pl-1.5',
				isOpen
					? 'border-primary bg-primary-wash'
					: 'border-border-primary bg-bg-primary',
				className
			)}
		>
			<ProjectTile project={project} />
			{isSidebarOpen ? (
				<>
					<span className="flex min-w-0 flex-1 flex-col">
						<span className="truncate text-sm leading-5 font-medium text-text-primary">
							{project ? project.name : ALL_PROJECTS_LABEL}
						</span>
						<span className="truncate text-xs leading-4 font-normal text-text-menu">
							{project ? 'Project' : 'Every project'}
						</span>
					</span>
					{/* In the nav's 24px arrow box, so it lines up with their arrows */}
					<span className="grid size-6 flex-shrink-0 place-items-center text-text-menu">
						<CaretSortIcon aria-hidden="true" className="size-5" />
					</span>
				</>
			) : (
				// The tile alone says too little to a screen reader
				<span className="sr-only">
					{project ? project.name : ALL_PROJECTS_LABEL}
				</span>
			)}
		</button>
	);
});

interface ProjectSwitcherProps {
	projects: readonly Project[];
	currentProject?: Project;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	search: string;
	onSearchChange: (search: string) => void;
	onSelect: (projectId: number | undefined) => void;
	isSidebarOpen: boolean;
	renderMeta: (projectId?: number) => ReactNode;
}

function ProjectSwitcher(props: ProjectSwitcherProps) {
	const {
		projects,
		currentProject,
		isOpen,
		onOpenChange,
		search,
		onSearchChange,
		onSelect,
		isSidebarOpen,
		renderMeta
	} = props;
	const isSearching = search.trim().length > 0;

	return (
		<Popover open={isOpen} onOpenChange={onOpenChange}>
			<Tooltip
				content="Switch project (P)"
				side="right"
				sideOffset={14}
				disabled={isSidebarOpen || isOpen}
			>
				<PopoverTrigger asChild>
					<ProjectSwitcherTrigger
						project={currentProject}
						isOpen={isOpen}
						isSidebarOpen={isSidebarOpen}
					/>
				</PopoverTrigger>
			</Tooltip>
			<PopoverContent
				portal
				side={isSidebarOpen ? 'bottom' : 'right'}
				align="start"
				sideOffset={isSidebarOpen ? 6 : 14}
				aria-label="Projects"
				data-testid="project-picker-list"
				className="w-[340px] max-w-[calc(100vw-16px)] overflow-hidden rounded-xl border border-border-primary bg-bg-elevated p-0 shadow-popover"
			>
				<Command loop className="bg-transparent rounded-none">
					<div
						className={cn(
							'p-2.5 border-b border-border-primary',
							'[&_[cmdk-input-wrapper]]:h-9 [&_[cmdk-input-wrapper]]:gap-2 [&_[cmdk-input-wrapper]]:px-2.5',
							'[&_[cmdk-input-wrapper]]:rounded-lg [&_[cmdk-input-wrapper]]:border [&_[cmdk-input-wrapper]]:border-border-input',
							'[&_[cmdk-input-wrapper]:focus-within]:border-primary [&_[cmdk-input-wrapper]:focus-within]:shadow-text-field'
						)}
					>
						<CommandInput
							placeholder="Find project…"
							aria-label="Find project"
							value={search}
							onValueChange={onSearchChange}
							className="h-full py-0 px-0 text-[0.8125rem]"
							startIcon={
								<Icon
									name="MagnifyingGlass"
									size={16}
									className="flex-shrink-0 text-text-menu"
								/>
							}
							endIcon={<Kbd aria-hidden="true">P</Kbd>}
						/>
					</div>
					<CommandList className="max-h-[420px] p-1.5">
						<CommandEmpty className="px-2.5 py-5 text-center text-[0.8125rem] text-text-menu">
							No project matches “{search}”
						</CommandEmpty>
						<CommandGroup
							heading={isSearching ? 'Results' : ALL_PROJECTS_LABEL}
							className={groupStyles}
						>
							<ProjectOption
								value={ALL_PROJECTS_LABEL}
								testId="project-picker-option"
								isCurrent={!currentProject}
								meta={renderMeta()}
								onSelect={() => onSelect(undefined)}
							/>
							{projects.map((project) => (
								<ProjectOption
									key={project.id}
									project={project}
									value={project.name}
									testId="project-picker-option"
									isCurrent={project.id === currentProject?.id}
									meta={renderMeta(project.id)}
									onSelect={() => onSelect(project.id)}
								/>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

export { ProjectLastRun, ProjectSwitcher, ProjectTile };
export type { ProjectLastRunProps, ProjectSwitcherProps };
