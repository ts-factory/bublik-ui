/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type {
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
 * Lifts the mode card so its first layout sits level with the row's icon:
 * the row is 36px tall, so its middle is 18px down, while the first layout's
 * middle is 44px into the card (4 padding + 18 caption + 2 gap + 5 separator
 * + 2 gap + 13 half a layout). Keep it in step with the card's classes.
 */
const MODE_PANEL_ALIGN_OFFSET = 18 - 44;

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
					collapsedHoverContent={
						modeSwitch ? (
							<SidebarNavSubmenuModePanel {...modeSwitch.props} />
						) : undefined
					}
					collapsedHoverAlignOffset={MODE_PANEL_ALIGN_OFFSET}
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
								<div className="bg-white p-6 rounded-lg">
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
			// row's tint a primary tray would melt in, so it turns white there.
			className={cn(
				'ml-auto flex shrink-0 items-center gap-0.5 rounded-md p-0.5',
				isActive ? 'bg-white' : 'bg-primary/10'
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
 * The mode switch as the collapsed sidebar shows it: a card beside the row,
 * each layout spelled out next to its icon since the card has the room. It
 * is dressed like the Column Visibility dropdown, with a small uppercase
 * caption instead of its roomier label.
 */
function SidebarNavSubmenuModePanel<T extends string>({
	items,
	value,
	onSelect,
	'aria-label': ariaLabel,
	testId
}: SidebarNavSubmenuModeSwitchProps<T>) {
	return (
		<div
			role="group"
			aria-label={ariaLabel}
			data-testid={testId ? `${testId}-panel` : undefined}
			data-mode-switch-panel
			// Sized to its longest layout name, not a fixed width.
			className="flex w-max min-w-40 flex-col gap-0.5 rounded-lg bg-white p-1 shadow-popover"
		>
			<span className="px-1.5 pb-0.5 pt-1 text-[0.625rem] font-semibold uppercase leading-3 tracking-[0.02em] text-text-menu">
				{ariaLabel}
			</span>
			<Separator className="-mx-1 my-0.5 h-px" />
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
		</div>
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

SidebarNavSubmenuItemContainer.Icon = SidebarNavSubmenuIcon;
SidebarNavSubmenuItemContainer.Label = SidebarNavSubmenuLabel;
SidebarNavSubmenuItemContainer.InfoButton = SidebarNavSubmenuInfoButton;
SidebarNavSubmenuItemContainer.ModeSwitch = SidebarNavSubmenuModeSwitch;
SidebarNavSubmenuItemContainer.SidebarAccordionLabel = SidebarAccordionLabel;

export const SidebarNavSubmenuItem = Object.assign(
	SidebarNavSubmenuItemComponent,
	{
		Icon: SidebarNavSubmenuIcon,
		Label: SidebarNavSubmenuLabel,
		InfoButton: SidebarNavSubmenuInfoButton,
		ModeSwitch: SidebarNavSubmenuModeSwitch,
		SidebarAccordionLabel: SidebarAccordionLabel
	}
);
