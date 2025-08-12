import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useQueryParam, NumericArrayParam } from 'use-query-params';

import { bublikAPI } from '@/services/bublik-api';
import {
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	Icon,
	Separator,
	Tooltip,
	cn,
	useSidebar
} from '@/shared/tailwind-ui';

function ProjectPickerContainer() {
	const { isSidebarOpen } = useSidebar();
	const {
		data: projects,
		isLoading,
		error
	} = bublikAPI.useGetAllProjectsQuery();
	const [isOpen, setIsOpen] = useState(false);

	const [selectedProjectIds = [], setSelectedProjectIds] = useQueryParam(
		'project',
		NumericArrayParam
	);

	const handleValueChange = (projectId: string) => {
		if (projectId === '') {
			setSelectedProjectIds([]);
		} else {
			setSelectedProjectIds([parseInt(projectId, 10)]);
		}
	};

	if (isLoading) return null;
	if (error) return null;
	if (!projects?.length) return null;

	const currentValue =
		selectedProjectIds?.length === 1 ? selectedProjectIds[0]?.toString() : '';

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
			<DropdownMenuPortal>
				<DropdownMenuContent
					className={cn(
						'min-w-[238px] rounded-lg bg-white p-1 shadow-popover z-40',
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
					<DropdownMenuRadioGroup
						value={currentValue}
						onValueChange={handleValueChange}
						className="gap-1 flex flex-col"
					>
						<DropdownMenuRadioItem
							value=""
							className={cn(
								!selectedProjectIds?.length &&
									'bg-[#ecf1ff] text-[#385bf9] focus:bg-[#ecf1ff] focus:text-[#385bf9]'
							)}
						>
							<span className="truncate text-md">All</span>
						</DropdownMenuRadioItem>
						{projects.map((project) => {
							const isSelected = selectedProjectIds?.includes(project.id);

							return (
								<DropdownMenuRadioItem
									key={project.id}
									value={project.id.toString()}
									className={cn(
										isSelected &&
											'bg-[#ecf1ff] text-[#385bf9] focus:bg-[#ecf1ff] focus:text-[#385bf9]'
									)}
								>
									<span className="truncate text-md">{project.name}</span>
								</DropdownMenuRadioItem>
							);
						})}
					</DropdownMenuRadioGroup>
					{/* <DropdownMenuSeparator /> */}
					{/* <CreateProjectModal>
						<DropdownMenuItem className="pl-2">
							<Icon name="FilePlus" size={20} className="mr-2" />
							<span className="text-md">New Project</span>
						</DropdownMenuItem>
					</CreateProjectModal> */}
				</DropdownMenuContent>
			</DropdownMenuPortal>
		</DropdownMenu.Root>
	);
}

export { ProjectPickerContainer };
