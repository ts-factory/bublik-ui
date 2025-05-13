import { useState } from 'react';

import { bublikAPI } from '@/services/bublik-api';
import { Icon, Tooltip, cn, useSidebar } from '@/shared/tailwind-ui';

import { useProjectSearch } from '../hooks';

function ProjectPickerContainer() {
	const { isSidebarOpen } = useSidebar();
	const {
		data: projects,
		isLoading,
		error
	} = bublikAPI.useGetAllProjectsQuery();
	const [isOpen, setIsOpen] = useState(false);

	const { projectIds, setProjectsIds } = useProjectSearch();

	const handleValueChange = (projectId: number | undefined) => {
		if (typeof projectId === 'undefined') {
			setProjectsIds([]);
		} else {
			setProjectsIds([projectId]);
		}
	};

	if (isLoading) return null;

	if (error) return null;

	if (!projects?.length) return null;

	return (
		<div
			className={cn(
				'transition-all rounded-lg delay-500 duration-500',
				isOpen && 'bg-primary-wash'
			)}
		>
			<Tooltip content="Projects" side="right" sideOffset={14}>
				<div
					className={cn(
						'group w-full relative rounded-[0.625rem] py-[7px] cursor-pointer',
						'hover:bg-primary-wash text-text-menu hover:text-primary',
						'flex min-w-0 flex-grow gap-3.5 items-center',
						'transition-[padding] duration-500',
						isSidebarOpen ? 'pl-4' : 'pl-2',
						isOpen && 'bg-primary hover:bg-primary hover:text-white text-white'
					)}
					onClick={() => setIsOpen((v) => !v)}
				>
					<div className="flex items-center gap-2">
						<div className="grid flex-shrink-0 place-items-center">
							<Icon name="Folder" size={28} />
						</div>
						<span className="text-[1.125rem] truncate">Projects</span>
					</div>
					<button
						aria-label="Toggle submenu"
						className={cn(
							'grid place-items-center ml-auto pr-4 rounded flex-shrink-0 [&_svg]:transition-transform [&_svg]:rounded',
							isOpen
								? '[&_svg]:rotate-180 [&_svg]:hover:bg-primary-wash [&_svg]:hover:text-primary'
								: '[&_svg]:rotate-90 [&_svg]:hover:bg-primary-wash'
						)}
					>
						<Icon name="ArrowShortTop" size={24} className="" />
					</button>
				</div>
			</Tooltip>
			<div
				className={cn(
					'[&>ul]:overflow-hidden grid transition-all transform-gpu ease-in-out motion-reduce:transition-none duration-500',
					isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
				)}
			>
				<ul className="gap-1 flex flex-col mt-3.5">
					<li
						onClick={() => handleValueChange(undefined)}
						role="button"
						className={cn(
							'flex items-center rounded-[10px] py-1.5 h-full gap-3.5 group pl-8 pr-[18px] text-text-menu hover:text-primary group',
							!projectIds?.length &&
								'bg-[#ecf1ff] text-[#385bf9] focus:bg-[#ecf1ff] focus:text-[#385bf9]'
						)}
					>
						<div
							className={cn(
								'w-2 h-2 rounded-full bg-primary',
								projectIds?.length && 'opacity-0'
							)}
						/>
						<span className="truncate text-[0.875rem] leading-[1.5rem]">
							All
						</span>
					</li>
					{projects.map((project) => {
						const isSelected = projectIds?.includes(project.id);

						return (
							<li
								key={project.id}
								role="button"
								onClick={() => handleValueChange(project.id)}
								className={cn(
									'flex items-center rounded-[10px] py-1.5 h-full gap-3.5 group pl-8 pr-[18px] text-text-menu hover:text-primary group',
									isSelected &&
										'bg-[#ecf1ff] text-[#385bf9] focus:bg-[#ecf1ff] focus:text-[#385bf9]'
								)}
							>
								<div
									className={cn(
										'w-2 h-2 rounded-full bg-primary',
										!isSelected && 'opacity-0'
									)}
								/>
								<span className="truncate text-[0.875rem] leading-[1.5rem]">
									{project.name}
								</span>
							</li>
						);
					})}
				</ul>
			</div>
		</div>
	);
}

export { ProjectPickerContainer };
