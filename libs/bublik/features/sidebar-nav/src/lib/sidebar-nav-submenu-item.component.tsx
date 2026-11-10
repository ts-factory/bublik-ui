/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type {
	ComponentPropsWithoutRef,
	ComponentType,
	MouseEvent,
	MouseEventHandler,
	PointerEvent,
	ReactElement,
	ReactNode
} from 'react';
import {
	Children,
	createContext,
	isValidElement,
	useContext,
	useState
} from 'react';
import { useLocation, type To } from 'react-router-dom';

import {
	cn,
	Dialog,
	DialogPortal,
	DialogContent,
	DialogOverlay,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Icon,
	Separator,
	Tooltip,
	useSidebar,
	dialogContentStyles,
	dialogOverlayStyles,
	type IconProps
} from '@/shared/tailwind-ui';

import {
	SidebarAccordionLink,
	SidebarAccordionLabel
} from './sidebar-nav-accordion.component';
import {
	getSubmenuIsActive,
	type SubmenuMatchPattern
} from './sidebar-nav.matchers';

interface SidebarNavSubmenuItemContextValue {
	disabled: boolean;
	isActive: boolean;
	/** The row's modes, when it has any and is enabled. */
	modeSwitch?: Pick<
		SidebarNavSubmenuModeSwitchProps<string>,
		'items' | 'value'
	>;
}

const SidebarNavSubmenuItemContext = createContext<
	SidebarNavSubmenuItemContextValue | undefined
>(undefined);

export function useSidebarNavSubmenuItem(): SidebarNavSubmenuItemContextValue {
	const context = useContext(SidebarNavSubmenuItemContext);
	if (context === undefined) {
		throw new Error(
			'useSidebarNavSubmenuItem must be used within SidebarNavSubmenuItemContainer'
		);
	}
	return context;
}

function SidebarNavSubmenuIcon({
	className,
	...props
}: Omit<IconProps, 'ref'>) {
	const { disabled, modeSwitch } = useSidebarNavSubmenuItem();
	const { isSidebarOpen } = useSidebar();
	return (
		<div
			className={cn(
				'relative grid flex-shrink-0 place-items-center',
				disabled && 'opacity-50'
			)}
		>
			<Icon {...props} className={cn('size-[22px]', className)} />
			{modeSwitch && !isSidebarOpen ? (
				<SidebarNavSubmenuModePips {...modeSwitch} />
			) : null}
		</div>
	);
}

function SidebarNavSubmenuLabel({ children }: { children: ReactNode }) {
	const { disabled } = useSidebarNavSubmenuItem();
	return (
		<span
			className={cn(
				'truncate text-[0.875rem] leading-[1.5rem]',
				disabled && 'opacity-50'
			)}
		>
			{children}
		</span>
	);
}

/**
 * Lifts the hover card so its first entry sits level with the row's icon:
 * the row is 36px tall, so its middle is 18px down, while the first entry's
 * middle is 44px into the card (4 padding + 18 caption + 2 gap + 5 separator
 * + 2 gap + 13 half an entry). Keep it in step with `SidebarNavSubmenuHoverPanel`.
 */
const HOVER_PANEL_ALIGN_OFFSET = 18 - 44;

type SidebarNavSubmenuItemProps = {
	children: ReactNode;
	isActive: boolean;
	disabled?: boolean;
} & (
	| {
			to: To;
			linkComponent?: ComponentType<{
				to: To;
				className?: string;
				style?: React.CSSProperties;
				children: ReactNode;
				onClick?: MouseEventHandler<HTMLAnchorElement>;
			}>;
	  }
	| { href: string }
);

function SidebarNavSubmenuItemComponent(props: SidebarNavSubmenuItemProps) {
	const { children, isActive, disabled } = props;

	const linkProps =
		'href' in props
			? { href: props.href }
			: { to: props.to, linkComponent: props.linkComponent };

	// The collapsed sidebar has no room for the mode tray, so the row offers
	// its modes in a hover card instead.
	const modeSwitch = disabled ? undefined : findModeSwitch(children);
	const linksMenu = disabled ? undefined : findLinksMenu(children);

	const collapsedHoverContent = modeSwitch ? (
		<SidebarNavSubmenuModePanel {...modeSwitch.props} />
	) : linksMenu?.props.items.length ? (
		<SidebarNavSubmenuLinksPanel {...linksMenu.props} />
	) : undefined;

	return (
		<li
			className="relative pt-3 first:pt-0"
			data-sidebar-nav-submenu-guide
			data-sidebar-nav-submenu-guide-active={isActive ? 'true' : undefined}
			data-sidebar-nav-submenu-guide-disabled={disabled ? 'true' : undefined}
		>
			<SidebarNavSubmenuItemContext.Provider
				value={{
					disabled: !!disabled,
					isActive,
					modeSwitch: modeSwitch?.props
				}}
			>
				<SidebarAccordionLink
					isActive={isActive}
					disabled={disabled}
					collapsedHoverContent={collapsedHoverContent}
					collapsedHoverAlignOffset={HOVER_PANEL_ALIGN_OFFSET}
					{...linkProps}
				>
					{children}
				</SidebarAccordionLink>
			</SidebarNavSubmenuItemContext.Provider>
		</li>
	);
}

interface SidebarNavSubmenuItemContainerProps {
	children: ReactNode;
	to: string;
	disabled?: boolean;
	pattern?: SubmenuMatchPattern;
	linkComponent?: ComponentType<{
		to: To;
		className?: string;
		style?: React.CSSProperties;
		children: ReactNode;
		onClick?: MouseEventHandler<HTMLAnchorElement>;
	}>;
}

export function SidebarNavSubmenuItemContainer({
	children,
	to,
	disabled = false,
	pattern,
	linkComponent
}: SidebarNavSubmenuItemContainerProps) {
	const location = useLocation();
	const isActive = pattern ? getSubmenuIsActive(location, pattern) : true;

	return (
		<SidebarNavSubmenuItemComponent
			to={to}
			isActive={isActive}
			disabled={disabled}
			linkComponent={linkComponent}
		>
			{children}
		</SidebarNavSubmenuItemComponent>
	);
}

function SidebarNavSubmenuInfoButton({ children }: { children: ReactNode }) {
	const { disabled } = useSidebarNavSubmenuItem();
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const { isSidebarOpen } = useSidebar();

	if (!children || !isSidebarOpen) return null;

	const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		setIsDialogOpen(true);
	};

	const stopDialogEventPropagation = (
		event: MouseEvent<HTMLDivElement> | PointerEvent<HTMLDivElement>
	) => {
		event.stopPropagation();
	};

	return (
		<>
			<button
				type="button"
				onClick={handleClick}
				data-info-button
				className={cn(
					'rounded ml-auto p-0.5 hover:bg-primary-wash hover:text-primary',
					disabled
						? 'text-primary pointer-events-auto visible opacity-100'
						: 'opacity-0 invisible group-hover:visible group-hover:opacity-100',
					'transition-opacity duration-300 delay-0',
					'group-hover:pointer-events-auto'
				)}
			>
				<Icon name="InformationCircleQuestionMark" size={20} />
			</button>
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogPortal>
					<DialogOverlay
						className={dialogOverlayStyles()}
						onClick={stopDialogEventPropagation}
					>
						<DialogContent
							className={dialogContentStyles()}
							onClick={stopDialogEventPropagation}
							onPointerDown={stopDialogEventPropagation}
						>
							{children || (
								<div className="bg-bg-primary p-6 rounded-lg">
									<h2 className="text-lg font-semibold mb-4">Not Available</h2>
									<p>This section is not available yet.</p>
								</div>
							)}
						</DialogContent>
					</DialogOverlay>
				</DialogPortal>
			</Dialog>
		</>
	);
}

export interface SidebarNavSubmenuModeSwitchItem<T extends string> {
	value: T;
	icon: IconProps['name'];
	label: string;
}

interface SidebarNavSubmenuModeSwitchProps<T extends string> {
	items: ReadonlyArray<SidebarNavSubmenuModeSwitchItem<T>>;
	/** The tinted item; `null` tints none. */
	value: T | null;
	onSelect: (value: T) => void;
	'aria-label': string;
	testId?: string;
}

/**
 * What a mode button is, wherever it is drawn: it tints when selected and
 * swallows its own clicks so the row's link never follows them.
 */
function getModeButtonProps<T extends string>(
	item: SidebarNavSubmenuModeSwitchItem<T>,
	isSelected: boolean,
	onSelect: (value: T) => void
) {
	return {
		type: 'button' as const,
		'aria-pressed': isSelected,
		'data-mode-switch-item': item.value,
		onClick: (event: MouseEvent<HTMLButtonElement>) => {
			event.preventDefault();
			event.stopPropagation();
			onSelect(item.value);
		},
		className: cn(
			'rounded p-0.5 transition-colors',
			isSelected
				? 'bg-primary text-white'
				: 'text-text-menu hover:bg-primary-wash hover:text-primary'
		)
	};
}

/**
 * A row of icon buttons at the row's right end, one per layout of the page
 * the row links to. Like the info button it sits inside the row's link and
 * swallows its own clicks; unlike it, it goes away rather than being always
 * on while the row is disabled, since there is no page to lay out then.
 * While the sidebar is collapsed the row offers the same buttons in a hover
 * card instead, see `SidebarNavSubmenuModePanel`, and says so with
 * `SidebarNavSubmenuModePips`.
 */
function SidebarNavSubmenuModeSwitch<T extends string>({
	items,
	value,
	onSelect,
	'aria-label': ariaLabel,
	testId
}: SidebarNavSubmenuModeSwitchProps<T>) {
	const { disabled, isActive } = useSidebarNavSubmenuItem();
	const { isSidebarOpen } = useSidebar();

	if (disabled || !isSidebarOpen) return null;

	return (
		<span
			role="group"
			aria-label={ariaLabel}
			data-testid={testId}
			data-mode-switch
			// The tray is drawn whether or not one of its layouts is the page's,
			// so the buttons read as one control on every page. On the active
			// row's tint a primary tray would melt in, so it takes the surface
			// colour there.
			className={cn(
				'ml-auto flex shrink-0 items-center gap-0.5 rounded-md p-0.5',
				isActive ? 'bg-bg-primary' : 'bg-primary/10'
			)}
		>
			{items.map((item) => (
				<Tooltip
					key={item.value}
					content={item.label}
					side="top"
					delayDuration={400}
				>
					<button
						aria-label={item.label}
						{...getModeButtonProps(item, item.value === value, onSelect)}
					>
						<Icon name={item.icon} size={18} />
					</button>
				</Tooltip>
			))}
		</span>
	);
}

/**
 * What the collapsed sidebar shows beside a row. It is dressed like the Column
 * Visibility dropdown, with a small uppercase caption instead of its roomier
 * label, and is sized to its longest entry, not a fixed width.
 */
function SidebarNavSubmenuHoverPanel({
	label,
	children,
	...props
}: ComponentPropsWithoutRef<'div'> & { label: string }) {
	return (
		<div
			role="group"
			aria-label={label}
			className="flex w-max min-w-40 flex-col gap-0.5 rounded-lg bg-bg-elevated p-1 shadow-popover"
			{...props}
		>
			<span className="px-1.5 pb-0.5 pt-1 text-[0.625rem] font-semibold uppercase leading-3 tracking-[0.02em] text-text-menu">
				{label}
			</span>
			<Separator className="-mx-1 my-0.5 h-px" />
			{children}
		</div>
	);
}

/**
 * The mode switch as the collapsed sidebar shows it, each layout spelled out
 * next to its icon since the card has the room.
 */
function SidebarNavSubmenuModePanel<T extends string>({
	items,
	value,
	onSelect,
	'aria-label': ariaLabel,
	testId
}: SidebarNavSubmenuModeSwitchProps<T>) {
	return (
		<SidebarNavSubmenuHoverPanel
			label={ariaLabel}
			data-testid={testId ? `${testId}-panel` : undefined}
			data-mode-switch-panel
		>
			{items.map((item) => {
				const buttonProps = getModeButtonProps(
					item,
					item.value === value,
					onSelect
				);

				return (
					<button
						key={item.value}
						{...buttonProps}
						className={cn(
							buttonProps.className,
							'flex items-center gap-1.5 py-1 pl-1 pr-2 text-xs'
						)}
					>
						<Icon name={item.icon} size={18} />
						{item.label}
					</button>
				);
			})}
		</SidebarNavSubmenuHoverPanel>
	);
}

export interface SidebarNavSubmenuLinksMenuItem {
	id: string;
	label: string;
	description?: string;
	to: string;
}

interface SidebarNavSubmenuLinksMenuProps {
	items: ReadonlyArray<SidebarNavSubmenuLinksMenuItem>;
	'aria-label': string;
	linkComponent: NonNullable<
		SidebarNavSubmenuItemContainerProps['linkComponent']
	>;
	testId?: string;
}

/**
 * Stops a click in a portal at the portal. React bubbles it through the
 * component tree into the row's link, which would then follow its own URL.
 * It must not `preventDefault`: the link clicked on still has to navigate.
 */
function stopClickReachingRowLink(event: MouseEvent<HTMLElement>) {
	event.stopPropagation();
}

/**
 * An arrow at the row's right end, opening a menu of other pages the row could
 * link to. Like the mode switch it sits inside the row's link and goes away on
 * a disabled row, and the collapsed sidebar offers the same links in a hover
 * card, see `SidebarNavSubmenuLinksPanel`.
 */
function SidebarNavSubmenuLinksMenu({
	items,
	'aria-label': ariaLabel,
	linkComponent: LinkComponent,
	testId
}: SidebarNavSubmenuLinksMenuProps) {
	const { disabled } = useSidebarNavSubmenuItem();
	const { isSidebarOpen } = useSidebar();

	if (disabled || !isSidebarOpen || !items.length) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					aria-label={ariaLabel}
					data-testid={testId}
					onClick={(event) => {
						event.preventDefault();
						event.stopPropagation();
					}}
					// A row with a mode tray pads its right side 4px less, so the
					// arrow reaches 2px into the padding to sit under the tray's
					// last icon, past the tray's own 2px of padding.
					className={cn(
						'ml-auto -mr-0.5 shrink-0 rounded p-0.5 transition-colors',
						'text-text-menu hover:bg-primary-wash hover:text-primary',
						'rdx-state-open:bg-primary-wash rdx-state-open:text-primary'
					)}
				>
					<Icon name="ArrowShortTop" size={18} className="rotate-180" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				side="bottom"
				align="start"
				onClick={stopClickReachingRowLink}
			>
				<DropdownMenuLabel>{ariaLabel}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{items.map((item) => (
					<Tooltip
						key={item.id}
						content={item.description ?? ''}
						disabled={!item.description}
						side="right"
						sideOffset={8}
					>
						<DropdownMenuItem asChild className="gap-4 pl-2">
							<LinkComponent to={item.to}>
								{item.label}
								<Icon
									name="BoxArrowRight"
									className="ml-auto size-4 text-primary"
								/>
							</LinkComponent>
						</DropdownMenuItem>
					</Tooltip>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/** The links menu as the collapsed sidebar shows it. */
function SidebarNavSubmenuLinksPanel({
	items,
	'aria-label': ariaLabel,
	linkComponent: LinkComponent,
	testId
}: SidebarNavSubmenuLinksMenuProps) {
	return (
		<SidebarNavSubmenuHoverPanel
			label={ariaLabel}
			data-testid={testId ? `${testId}-panel` : undefined}
		>
			{items.map((item) => (
				<LinkComponent
					key={item.id}
					to={item.to}
					className={cn(
						// As tall as a mode button, which `HOVER_PANEL_ALIGN_OFFSET` counts on.
						'flex min-h-[26px] items-center rounded py-1 pl-1 pr-2 text-xs transition-colors',
						'text-text-menu hover:bg-primary-wash hover:text-primary'
					)}
				>
					{item.label}
				</LinkComponent>
			))}
		</SidebarNavSubmenuHoverPanel>
	);
}

/**
 * The collapsed row's only sign that hovering it offers modes: a dot per
 * layout under its icon, the page's own one solid. The row is 36px tall and
 * its icon 22px, so the dots fit in the 7px below the icon.
 */
function SidebarNavSubmenuModePips({
	items,
	value
}: Pick<SidebarNavSubmenuModeSwitchProps<string>, 'items' | 'value'>) {
	return (
		<span
			aria-hidden
			data-mode-pips
			className="pointer-events-none absolute left-1/2 top-full mt-0.5 flex -translate-x-1/2 gap-0.5"
		>
			{items.map((item) => (
				<span
					key={item.value}
					data-mode-pip={item.value}
					data-selected={item.value === value ? 'true' : undefined}
					className={cn(
						'size-[3px] rounded-full bg-current',
						item.value !== value && 'opacity-30'
					)}
				/>
			))}
		</span>
	);
}

function findModeSwitch(
	children: ReactNode
): ReactElement<SidebarNavSubmenuModeSwitchProps<string>> | undefined {
	return Children.toArray(children).find(
		(child): child is ReactElement<SidebarNavSubmenuModeSwitchProps<string>> =>
			isValidElement(child) && child.type === SidebarNavSubmenuModeSwitch
	);
}

function findLinksMenu(
	children: ReactNode
): ReactElement<SidebarNavSubmenuLinksMenuProps> | undefined {
	return Children.toArray(children).find(
		(child): child is ReactElement<SidebarNavSubmenuLinksMenuProps> =>
			isValidElement(child) && child.type === SidebarNavSubmenuLinksMenu
	);
}

SidebarNavSubmenuItemContainer.Icon = SidebarNavSubmenuIcon;
SidebarNavSubmenuItemContainer.Label = SidebarNavSubmenuLabel;
SidebarNavSubmenuItemContainer.InfoButton = SidebarNavSubmenuInfoButton;
SidebarNavSubmenuItemContainer.ModeSwitch = SidebarNavSubmenuModeSwitch;
SidebarNavSubmenuItemContainer.LinksMenu = SidebarNavSubmenuLinksMenu;
SidebarNavSubmenuItemContainer.SidebarAccordionLabel = SidebarAccordionLabel;

export const SidebarNavSubmenuItem = Object.assign(
	SidebarNavSubmenuItemComponent,
	{
		Icon: SidebarNavSubmenuIcon,
		Label: SidebarNavSubmenuLabel,
		InfoButton: SidebarNavSubmenuInfoButton,
		ModeSwitch: SidebarNavSubmenuModeSwitch,
		LinksMenu: SidebarNavSubmenuLinksMenu,
		SidebarAccordionLabel: SidebarAccordionLabel
	}
);
