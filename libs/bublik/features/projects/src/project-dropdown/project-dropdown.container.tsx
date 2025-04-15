import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import { bublikAPI, Project } from '@/services/bublik-api';
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

function ProjectPickerContainer() {
	const { isSidebarOpen } = useSidebar();
	const { data, isLoading, error } = bublikAPI.useGetAllProjectsQuery();

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

	// if (!data?.length) return null;

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

export { ProjectPickerContainer };
