/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import { LogPageMode, MeasurementsMode } from '@/shared/types';
import {
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	Icon,
	Separator,
	Tooltip,
	cn,
	useSidebar
} from '@/shared/tailwind-ui';

import { NavLink, SidebarItem } from '../nav-link';
import {
	MultipleRunsDialog,
	CompareRunsDialog,
	RunDetailsDialog,
	RunReportDialog,
	LogDialog,
	ResultMeasurementsDialog,
	HistoryHelpDialog,
	RunsDialog,
	RunsChartsDialog,
	DashboardDialog
} from './instruction-dialog';

const mainMenu: SidebarItem[] = [
	{
		label: 'Dashboard',
		to: '/dashboard',
		icon: <Icon name="Category" />,
		pattern: { path: '/dashboard' },
		dialogContent: <DashboardDialog />
	},
	{
		label: 'Runs',
		to: '/runs',
		icon: <Icon name="Play" />,
		dialogContent: <RunsDialog />,
		pattern: [{ path: '/runs' }, { path: '/compare' }, { path: '/multiple' }],
		subitems: [
			{
				label: 'List',
				to: '/runs',
				dialogContent: <RunsDialog />,
				icon: <Icon name="PaperListText" size={24} />,
				pattern: { path: '/runs', search: { mode: 'table' } }
			},
			{
				label: 'Charts',
				to: '/runs',
				dialogContent: <RunsChartsDialog />,
				icon: <Icon name="LineChartMultiple" />,
				pattern: { path: '/runs', search: { mode: 'charts' } }
			},
			{
				label: 'Multiple',
				icon: <Icon name="PaperStack" className="w-6 h-6" />,
				to: '/runs',
				whenMatched: true,
				pattern: { path: '/multiple' },
				dialogContent: <MultipleRunsDialog />
			},
			{
				label: 'Compare',
				to: '/compare',
				whenMatched: true,
				dialogContent: <CompareRunsDialog />,
				icon: <Icon name="SwapArrows" className="rotate-90" />,
				pattern: { path: '/compare' }
			}
		]
	},
	{
		label: 'Run',
		to: '/runs',
		icon: <Icon name="PieChart" />,
		pattern: [{ path: '/runs/:runId' }],
		whenMatched: true,
		dialogContent: <RunDetailsDialog />,
		subitems: [
			{
				label: 'Details',
				icon: <Icon name="Paper" className="w-6 h-6" />,
				to: '/runs',
				whenMatched: true,
				dialogContent: <RunDetailsDialog />,
				pattern: { path: '/runs/:runId' }
			},
			{
				label: 'Report',
				icon: <Icon name="LineChart" />,
				to: '/runs',
				whenMatched: true,
				pattern: { path: '/runs/:runId/report' },
				dialogContent: <RunReportDialog />
			}
		]
	},
	{
		label: 'Log',
		icon: <Icon name="Paper" size={28} />,
		to: '/log',
		pattern: { path: '/log/:runId' },
		whenMatched: true,
		dialogContent: <LogDialog />,
		subitems: [
			{
				label: 'Tree+info+log',
				icon: <Icon name="LayoutLogHeaderSidebar" />,
				to: '/log',
				whenMatched: true,
				dialogContent: <LogDialog />,
				pattern: {
					path: '/log/:runId',
					search: { mode: LogPageMode.TreeAndInfoAndLog }
				}
			},
			{
				label: 'Tree+log',
				icon: <Icon name="LayoutLogSidebar" />,
				to: '/log',
				whenMatched: true,
				dialogContent: <LogDialog />,
				pattern: {
					path: '/log/:runId',
					search: { mode: LogPageMode.TreeAndLog }
				}
			},
			{
				label: 'Info+log',
				icon: <Icon name="LayoutLogHeader" />,
				to: '/log',
				whenMatched: true,
				dialogContent: <LogDialog />,
				pattern: {
					path: '/log/:runId',
					search: { mode: LogPageMode.InfoAndLog }
				}
			},
			{
				label: 'Log',
				icon: <Icon name="LayoutLogSingle" />,
				to: '/log',
				whenMatched: true,
				dialogContent: <LogDialog />,
				pattern: { path: '/log/:runId', search: { mode: LogPageMode.Log } }
			}
		]
	},
	{
		label: 'History',
		to: '/history',
		icon: <Icon name="TimeCircle" />,
		dialogContent: <HistoryHelpDialog />,
		pattern: { path: '/history' },
		subitems: [
			{
				label: 'List Of Results',
				to: '/history',
				dialogContent: <HistoryHelpDialog />,
				icon: <Icon name="PaperListText" />,
				pattern: { path: '/history', search: { mode: 'linear', page: '1' } }
			},
			{
				label: 'Groups Of Results',
				to: '/history',
				dialogContent: <HistoryHelpDialog />,
				icon: <Icon name="Aggregation" />,
				pattern: {
					path: '/history',
					search: { mode: 'aggregation', page: '1' }
				}
			},
			{
				label: 'Charts',
				to: '/history',
				dialogContent: <HistoryHelpDialog />,
				icon: <Icon name="LineChartSingle" />,
				pattern: { path: '/history', search: { mode: 'measurements' } }
			},
			{
				label: 'Stacked Charts',
				to: '/history',
				dialogContent: <HistoryHelpDialog />,
				icon: <Icon name="LineChartMultiple" />,
				pattern: { path: '/history', search: { mode: 'measurements-combined' } }
			}
		]
	},
	{
		label: 'Result',
		to: '/runs/:runId/results/:resultId/measurements',
		icon: <Icon name="LineGraph" />,
		whenMatched: true,
		dialogContent: <ResultMeasurementsDialog />,
		pattern: {
			path: '/runs/:runId/results/:resultId/measurements',
			search: { mode: MeasurementsMode.Default }
		},
		subitems: [
			{
				label: 'Charts + Tables',
				icon: <Icon name="LineChart" />,
				to: '/runs',
				whenMatched: true,
				dialogContent: <ResultMeasurementsDialog />,
				pattern: {
					path: '/runs/:runId/results/:resultId/measurements',
					search: { mode: MeasurementsMode.Default }
				}
			},
			{
				label: 'Charts || Tables',
				icon: <Icon name="LayoutSidebarHeader" />,
				to: '/runs',
				whenMatched: true,
				dialogContent: <ResultMeasurementsDialog />,
				pattern: {
					path: '/runs/:runId/results/:resultId/measurements',
					search: { mode: MeasurementsMode.Split }
				}
			},
			{
				label: 'Measurement Tables',
				icon: <Icon name="PaperListText" />,
				to: '/runs',
				whenMatched: true,
				dialogContent: <ResultMeasurementsDialog />,
				pattern: {
					path: '/runs/:runId/results/:resultId/measurements',
					search: { mode: MeasurementsMode.Tables }
				}
			},
			{
				label: 'Stacked Charts',
				icon: <Icon name="LineChartMultiple" />,
				to: '/runs',
				whenMatched: true,
				dialogContent: <ResultMeasurementsDialog />,
				pattern: {
					path: '/runs/:runId/results/:resultId/measurements',
					search: { mode: MeasurementsMode.Overlay }
				}
			}
		]
	}
];

interface Project {
	id: string;
	name: string;
}

const SAMPLE_PROJECTS: Project[] = [
	{ id: '1', name: 'Project A' },
	{ id: '2', name: 'Project B' },
	{ id: '3', name: 'Project C' }
];

function ProjectPickerContainer() {
	const { isSidebarOpen } = useSidebar();

	const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
	const [isOpen, setIsOpen] = useState(false);

	const toggleProject = (project: Project) => {
		setSelectedProjects((prev) => {
			const isSelected = prev.some((p) => p.id === project.id);
			if (isSelected) {
				return prev.filter((p) => p.id !== project.id);
			}
			return [...prev, project];
		});
	};

	return (
		<DropdownMenu.Root
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) return;
				setIsOpen(open);
			}}
		>
			<Tooltip content="Projects" side="right" sideOffset={14}>
				<DropdownMenu.Trigger asChild>
					<div
						className={cn(
							'group relative rounded-[0.625rem] py-[7px] cursor-pointer',
							'hover:bg-primary-wash text-text-menu hover:text-primary',
							'flex min-w-0 flex-grow gap-3.5 items-center',
							'transition-[padding] duration-500',
							isSidebarOpen ? 'pl-4' : 'pl-2',
							isOpen && 'bg-primary text-white'
						)}
					>
						<div className="grid flex-shrink-0 place-items-center">
							<Icon name="Folder" size={28} />
						</div>
						<span className="text-[1.125rem] truncate">Projects</span>
					</div>
				</DropdownMenu.Trigger>
			</Tooltip>
			<DropdownMenuContent
				className={cn(
					'min-w-[238px] rounded-lg bg-white p-1 shadow-popover z-50',
					'rdx-state-open:rdx-side-top:animate-slide-down-fade',
					'rdx-state-open:rdx-side-right:animate-slide-left-fade',
					'rdx-state-open:rdx-side-bottom:animate-slide-up-fade',
					'rdx-state-open:rdx-side-left:animate-slide-right-fade',
					'rdx-state-closed:rdx-side-top:animate-fade-out',
					'rdx-state-closed:rdx-side-right:animate-fade-out',
					'rdx-state-closed:rdx-side-bottom:animate-fade-out',
					'rdx-state-closed:rdx-side-left:animate-fade-out'
				)}
				sideOffset={0}
				onInteractOutside={() => setIsOpen(false)}
				collisionPadding={8}
			>
				<DropdownMenuLabel className="text-md">Projects</DropdownMenuLabel>
				<Separator className="h-px my-1" />
				<DropdownMenuGroup className="gap-1 flex flex-col">
					{SAMPLE_PROJECTS.map((project) => {
						const isSelected = selectedProjects.some(
							(p) => p.id === project.id
						);
						return (
							<DropdownMenuCheckboxItem
								key={project.id}
								checked={isSelected}
								className={cn(
									isSelected &&
										'bg-[#ecf1ff] text-[#385bf9] focus:bg-[#ecf1ff] focus:text-[#385bf9]'
								)}
								onCheckedChange={() => toggleProject(project)}
							>
								<span className="truncate text-md">{project.name}</span>
							</DropdownMenuCheckboxItem>
						);
					})}
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem className="pl-2">
					<Icon name="FilePlus" size={20} className="mr-2" />
					<span className="text-md">New Project</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu.Root>
	);
}

function MainNavigation() {
	return (
		<ul className="flex flex-col gap-3">
			<ProjectPickerContainer />
			{mainMenu.map((item) => (
				<NavLink key={item.label} {...item} />
			))}
		</ul>
	);
}

export { MainNavigation };
