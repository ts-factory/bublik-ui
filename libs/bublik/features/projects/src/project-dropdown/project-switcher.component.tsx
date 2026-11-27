/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	CSSProperties,
	ComponentPropsWithoutRef,
	KeyboardEvent,
	ReactNode,
	forwardRef,
	useRef,
	useState
} from 'react';
import {
	DndContext,
	DragEndEvent,
	Modifier,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors
} from '@dnd-kit/core';
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
	CaretSortIcon,
	CheckIcon,
	ChevronDownIcon,
	DragHandleDots2Icon,
	GearIcon,
	PlusIcon
} from '@radix-ui/react-icons';
import { ArrowUpDown } from 'lucide-react';

import type { Project } from '@/services/bublik-api';
import {
	ButtonTw,
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Icon,
	Kbd,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	cn,
	sidebarPaddingTransition
} from '@/shared/tailwind-ui';

import { LinkWithProject } from '../link-with-project';
import {
	PROJECT_SORTS,
	PROJECT_SORT_LABELS,
	matchesProjectSearch,
	moveProjectBy,
	moveProjectTo,
	type ProjectSort
} from './project-order.utils';
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
	/** Laid over the check mark's place, and over the mark while it shows. */
	dragHandle?: ReactNode;
	isDragging?: boolean;
	style?: CSSProperties;
}

const ProjectOption = forwardRef<HTMLDivElement, ProjectOptionProps>(
	function ProjectOption(props, ref) {
		const {
			project,
			value,
			testId,
			isCurrent,
			meta,
			onSelect,
			dragHandle,
			isDragging = false,
			style
		} = props;

		return (
			<CommandItem
				ref={ref}
				style={style}
				value={value}
				onSelect={onSelect}
				data-testid={testId}
				data-project-id={project ? project.id : 'all'}
				data-current={isCurrent}
				className={cn(
					'group gap-2.5 rounded-lg px-2.5 py-[7px] cursor-pointer text-text-primary',
					'data-[selected=true]:text-text-primary',
					isCurrent && 'bg-bg-selected data-[selected=true]:bg-bg-selected',
					// Opaque, so the rows it is dragged over do not show through
					isDragging &&
						'z-10 bg-bg-elevated shadow-popover data-[selected=true]:bg-bg-elevated'
				)}
			>
				<ProjectTile project={project} />
				<span className="flex min-w-0 flex-1 flex-col">
					<span className="truncate text-[0.8125rem] leading-[1.125rem] font-semibold">
						{project ? project.name : ALL_PROJECTS_LABEL}
					</span>
					{meta}
				</span>
				{/* Every row keeps the place, so a name is cut at the same width
				    whether or not its row is the current one */}
				<span className="relative grid size-[18px] flex-shrink-0 place-items-center">
					{isCurrent ? (
						<CheckIcon
							role="img"
							aria-label="Current project"
							className={cn(
								'size-[18px] text-text-selected',
								// The handle takes its place while it shows
								dragHandle &&
									'group-hover:opacity-0 [@media(hover:none)]:opacity-0',
								isDragging && 'opacity-0'
							)}
						/>
					) : null}
					{dragHandle}
				</span>
			</CommandItem>
		);
	}
);

/**
 * A row moves up and down between the first project and the last, never out
 * over the all-projects row or the edge of the popover.
 */
const keepInsideProjects: Modifier = (args) => {
	const { transform, draggingNodeRect, containerNodeRect } = args;

	if (!draggingNodeRect || !containerNodeRect) return { ...transform, x: 0 };

	const highest = containerNodeRect.top - draggingNodeRect.top;
	const lowest = containerNodeRect.bottom - draggingNodeRect.bottom;

	return {
		...transform,
		x: 0,
		y: Math.min(Math.max(transform.y, highest), lowest)
	};
};

const DRAG_MODIFIERS = [keepInsideProjects];

type SortableProjectOptionProps = Omit<
	ProjectOptionProps,
	'project' | 'dragHandle' | 'isDragging' | 'style'
> & { project: Project };

function SortableProjectOption(props: SortableProjectOptionProps) {
	const {
		setNodeRef,
		setActivatorNodeRef,
		listeners,
		transform,
		transition,
		isDragging
	} = useSortable({ id: props.project.id });

	return (
		<ProjectOption
			{...props}
			ref={setNodeRef}
			isDragging={isDragging}
			style={{ transform: CSS.Translate.toString(transform), transition }}
			dragHandle={
				// A pointer affordance only: the keyboard moves a row with
				// Alt+arrow, as the arrows alone already walk the list
				<span
					ref={setActivatorNodeRef}
					{...listeners}
					aria-hidden="true"
					title="Drag to reorder (Alt+↑ / Alt+↓)"
					data-testid="project-picker-drag-handle"
					// The search keeps the focus, and the click that ends a drag
					// must not pick the project
					onMouseDown={(event) => event.preventDefault()}
					onClick={(event) => event.stopPropagation()}
					className={cn(
						// Past the 18px it sits in, for an easier target
						'absolute -inset-1 grid place-items-center rounded',
						'cursor-grab touch-none text-text-menu hover:text-text-primary',
						// On hover, not on cmdk's highlight: that one also follows
						// the keyboard, and starts on a row nobody pointed at
						'opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100',
						isDragging && 'cursor-grabbing opacity-100'
					)}
				>
					<DragHandleDots2Icon className="size-4" />
				</span>
			}
		/>
	);
}

interface ProjectOrderMenuProps {
	sort: ProjectSort;
	onSortChange: (sort: ProjectSort) => void;
	/** Where the focus goes once the menu closes. */
	onClosed: () => void;
}

function ProjectOrderMenu(props: ProjectOrderMenuProps) {
	const { sort, onSortChange, onClosed } = props;
	const [isOpen, setIsOpen] = useState(false);

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				{/* The toolbars' menu button: filled while its menu is open */}
				<ButtonTw
					type="button"
					variant="secondary"
					size="xss"
					state={isOpen && 'active'}
					aria-label={`Project order: ${PROJECT_SORT_LABELS[sort]}`}
					data-testid="project-picker-order"
					className="flex-shrink-0 gap-1"
				>
					<ArrowUpDown aria-hidden="true" className="size-3.5" />
					{PROJECT_SORT_LABELS[sort]}
					<ChevronDownIcon aria-hidden="true" className="size-3.5" />
				</ButtonTw>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-44"
				data-testid="project-picker-order-menu"
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					onClosed();
				}}
			>
				<DropdownMenuLabel>Order</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuRadioGroup
					value={sort}
					onValueChange={(value) => {
						const next = PROJECT_SORTS.find((option) => option === value);

						if (next) onSortChange(next);
					}}
				>
					{PROJECT_SORTS.map((option) => (
						<DropdownMenuRadioItem
							key={option}
							value={option}
							className="text-xs"
						>
							{PROJECT_SORT_LABELS[option]}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

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

const footerActionStyles = 'flex-1 basis-0 gap-1.5 rounded-lg';

interface ProjectSwitcherFooterProps {
	onCreateProject: () => void;
	onManage: () => void;
}

function ProjectSwitcherFooter(props: ProjectSwitcherFooterProps) {
	const { onCreateProject, onManage } = props;

	return (
		<div
			className="flex flex-shrink-0 gap-1.5 border-t border-border-primary bg-bg-elevated p-2"
			data-testid="project-picker-actions"
		>
			<ButtonTw
				type="button"
				variant="secondary"
				size="xs/2"
				className={footerActionStyles}
				onClick={onCreateProject}
			>
				<PlusIcon aria-hidden="true" className="size-4" />
				New Project
			</ButtonTw>
			<ButtonTw
				asChild
				variant="secondary"
				size="xs/2"
				className={footerActionStyles}
			>
				<LinkWithProject to="/admin/config" onClick={onManage}>
					<GearIcon aria-hidden="true" className="size-4" />
					Manage
				</LinkWithProject>
			</ButtonTw>
		</div>
	);
}

interface ProjectSwitcherProps {
	/** In the order to list them: `sort` names it, and is not applied here. */
	projects: readonly Project[];
	currentProject?: Project;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	search: string;
	onSearchChange: (search: string) => void;
	onSelect: (projectId: number | undefined) => void;
	sort: ProjectSort;
	onSortChange: (sort: ProjectSort) => void;
	/** Every project id in its new place, which becomes the Custom Order. */
	onReorder: (projectIds: number[]) => void;
	isSidebarOpen: boolean;
	renderMeta: (projectId?: number) => ReactNode;
	/** Only admins get the footer; left out, it is not rendered. */
	actions?: ProjectSwitcherFooterProps;
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
		sort,
		onSortChange,
		onReorder,
		isSidebarOpen,
		renderMeta,
		actions
	} = props;
	const searchRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const sensors = useSensors(
		// A press that does not travel stays a click, wherever it lands
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
	);
	const isSearching = search.trim().length > 0;
	const heading = isSearching ? 'Results' : ALL_PROJECTS_LABEL;
	const listed = isSearching
		? projects.filter((project) => matchesProjectSearch(project.name, search))
		: projects;
	const isAllListed =
		!isSearching || matchesProjectSearch(ALL_PROJECTS_LABEL, search);
	// In any order: a drop makes what is listed the Custom Order. Not in a
	// search, which lists a part: a row has no place there to be dropped into
	const canReorder = !isSearching && projects.length > 1;
	const projectIds = projects.map((project) => project.id);

	const handleDragEnd = ({ active, over }: DragEndEvent) => {
		setIsDragging(false);

		if (!over || active.id === over.id) return;

		onReorder(moveProjectTo(projectIds, Number(active.id), Number(over.id)));
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (!canReorder || !event.altKey) return;
		if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
		// Not the order menu's keys: its button sits inside cmdk's root, and
		// those of its portalled items bubble here through React all the same
		if (
			event.target instanceof Element &&
			event.target.closest('button, [role="menu"]')
		) {
			return;
		}

		// Ours on every row, the all-projects one too, where it does nothing:
		// cmdk would walk the list with it as it does with the arrow alone
		event.preventDefault();

		const row = event.currentTarget.querySelector<HTMLElement>(
			'[cmdk-item][aria-selected="true"]'
		);
		const projectId = Number(row?.dataset['projectId']);

		if (!row || !Number.isInteger(projectId)) return;

		onReorder(
			moveProjectBy(projectIds, projectId, event.key === 'ArrowUp' ? -1 : 1)
		);
		// cmdk follows the highlight only when it moves to another row
		requestAnimationFrame(() => row.scrollIntoView({ block: 'nearest' }));
	};

	const renderProject = (project: Project) => {
		const Option = canReorder ? SortableProjectOption : ProjectOption;

		return (
			<Option
				key={project.id}
				project={project}
				// Not the name: cmdk tells rows apart by value, and no longer
				// searches it
				value={String(project.id)}
				testId="project-picker-option"
				isCurrent={project.id === currentProject?.id}
				meta={renderMeta(project.id)}
				onSelect={() => onSelect(project.id)}
			/>
		);
	};

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
				className={cn(
					'flex w-[340px] max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-xl border border-border-primary bg-bg-elevated p-0 shadow-popover',
					// As tall as the window has room for: a fixed height put every
					// project past the seventh behind a scrollbar on any screen
					'max-h-[var(--radix-popover-content-available-height)]'
				)}
			>
				{/* The list is filtered here, in the order it was given: cmdk
				    would rank the matches by moving their nodes, and leaves them
				    moved once the search is cleared */}
				<Command
					loop
					shouldFilter={false}
					disablePointerSelection={isDragging}
					onKeyDown={handleKeyDown}
					className="h-auto min-h-0 bg-transparent rounded-none"
				>
					<div
						className={cn(
							'flex-shrink-0 p-2.5 border-b border-border-primary',
							'[&_[cmdk-input-wrapper]]:h-9 [&_[cmdk-input-wrapper]]:gap-2 [&_[cmdk-input-wrapper]]:px-2.5',
							'[&_[cmdk-input-wrapper]]:rounded-lg [&_[cmdk-input-wrapper]]:border [&_[cmdk-input-wrapper]]:border-border-input',
							'[&_[cmdk-input-wrapper]:focus-within]:border-primary [&_[cmdk-input-wrapper]:focus-within]:shadow-text-field'
						)}
					>
						<CommandInput
							ref={searchRef}
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
					{/* Above the list rather than its first row, so the order stays
					    in reach however far the list is scrolled; the border is
					    where the rows scroll out of sight */}
					<div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-border-primary py-1.5 pl-4 pr-2.5">
						<span className="text-[0.6875rem] leading-[0.875rem] font-semibold uppercase tracking-[0.06em] text-text-menu">
							{heading}
						</span>
						<ProjectOrderMenu
							sort={sort}
							onSortChange={onSortChange}
							onClosed={() => searchRef.current?.focus()}
						/>
					</div>
					<CommandList
						label={heading}
						className="max-h-none min-h-0 overscroll-contain p-1.5 styled-scrollbar [scrollbar-width:thin]"
					>
						<CommandEmpty className="px-2.5 py-5 text-center text-[0.8125rem] text-text-menu">
							No project matches “{search}”
						</CommandEmpty>
						{isAllListed ? (
							<ProjectOption
								value={ALL_PROJECTS_LABEL}
								testId="project-picker-option"
								isCurrent={!currentProject}
								meta={renderMeta()}
								onSelect={() => onSelect(undefined)}
							/>
						) : null}
						{canReorder ? (
							<DndContext
								sensors={sensors}
								modifiers={DRAG_MODIFIERS}
								collisionDetection={closestCenter}
								onDragStart={() => setIsDragging(true)}
								onDragEnd={handleDragEnd}
								onDragCancel={() => setIsDragging(false)}
							>
								<SortableContext
									items={projectIds}
									strategy={verticalListSortingStrategy}
								>
									{/* The box a dragged row is kept inside */}
									<div>{listed.map(renderProject)}</div>
								</SortableContext>
							</DndContext>
						) : (
							listed.map(renderProject)
						)}
					</CommandList>
				</Command>
				{actions ? <ProjectSwitcherFooter {...actions} /> : null}
			</PopoverContent>
		</Popover>
	);
}

export { ProjectLastRun, ProjectSwitcher, ProjectTile };
export type { ProjectLastRunProps, ProjectSwitcherProps };
