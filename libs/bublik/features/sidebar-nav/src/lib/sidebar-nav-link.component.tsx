/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	PropsWithChildren,
	ReactNode,
	useState,
	forwardRef,
	createContext,
	useContext,
	type MouseEvent,
	type PointerEvent
} from 'react';

import {
	cn,
	Icon,
	Tooltip,
	useSidebar,
	sidebarPaddingTransition,
	Dialog,
	DialogPortal,
	DialogContent,
	DialogOverlay,
	dialogContentStyles,
	dialogOverlayStyles,
	type IconProps
} from '@/shared/tailwind-ui';

import {
	SidebarNavLinkInternalProps,
	SidebarNavLinkExternalProps
} from './sidebar-nav.types';
import { linkStyles } from './sidebar-nav.styles';
import { SidebarNavRouterLink } from './sidebar-nav-router-link.component';

interface SidebarNavInternalLinkContextValue {
	disabled: boolean;
}

const SidebarNavInternalLinkContext = createContext<
	SidebarNavInternalLinkContextValue | undefined
>(undefined);

export function useSidebarNavInternalLink(): SidebarNavInternalLinkContextValue {
	const context = useContext(SidebarNavInternalLinkContext);
	if (context === undefined) {
		throw new Error(
			'useSidebarNavInternalLink must be used within SidebarNavInternalLink'
		);
	}
	return context;
}

function SidebarNavInternalLinkIcon(props: Omit<IconProps, 'ref'>) {
	const { disabled } = useSidebarNavInternalLink();
	return (
		<div
			className={cn(
				'grid flex-shrink-0 place-items-center',
				disabled && 'cursor-not-allowed opacity-50 pointer-events-none'
			)}
		>
			<Icon {...props} />
		</div>
	);
}

/**
 * The entry's name. It never gives up width: when the row runs short, as it
 * does once the sidebar grows a scrollbar, a key badge after it truncates
 * before the name does.
 */
function SidebarNavInternalLinkLabel({ children }: { children: ReactNode }) {
	const { disabled } = useSidebarNavInternalLink();
	return (
		<span
			className={cn(
				'text-[1.125rem] truncate shrink-0',
				disabled && 'cursor-not-allowed opacity-50 pointer-events-none'
			)}
		>
			{children}
		</span>
	);
}

type SidebarNavInternalLinkProps = Omit<
	SidebarNavLinkInternalProps,
	'isSidebarOpen'
> & {
	children?: ReactNode;
};

const SidebarNavInternalLinkComponent = forwardRef<
	HTMLAnchorElement | HTMLDivElement,
	SidebarNavInternalLinkProps
>(({ to, linkComponent: LinkComponent, onClick, children, disabled }, ref) => {
	const { isSidebarOpen: isSidebarOpenRaw } = useSidebar();
	const isSidebarOpen = !!isSidebarOpenRaw;
	const isDisabled = !!disabled;

	const content = (
		<SidebarNavInternalLinkContext.Provider value={{ disabled: isDisabled }}>
			{children}
		</SidebarNavInternalLinkContext.Provider>
	);

	const className = linkStyles({ isSidebarOpen, disabled: isDisabled });
	const style = sidebarPaddingTransition;

	if (isDisabled) {
		return (
			<div
				ref={ref as React.Ref<HTMLDivElement>}
				className={cn(className)}
				style={style}
			>
				{content}
			</div>
		);
	}

	const RenderedLink = LinkComponent ?? SidebarNavRouterLink;

	return (
		<RenderedLink
			ref={ref as React.Ref<HTMLAnchorElement>}
			to={to}
			className={className}
			style={style}
			onClick={onClick}
		>
			{content}
		</RenderedLink>
	);
});

export const SidebarNavInternalLink = Object.assign(
	SidebarNavInternalLinkComponent,
	{
		Icon: SidebarNavInternalLinkIcon,
		Label: SidebarNavInternalLinkLabel
	}
);

SidebarNavInternalLink.displayName = 'SidebarNavInternalLink';

export const SidebarNavExternalLink = ({
	label,
	icon,
	href
}: Omit<SidebarNavLinkExternalProps, 'isSidebarOpen'>) => {
	const { isSidebarOpen: isSidebarOpenRaw } = useSidebar();
	const isSidebarOpen = !!isSidebarOpenRaw;

	return (
		<a
			href={href}
			className={linkStyles({ isSidebarOpen })}
			style={sidebarPaddingTransition}
			target="_blank"
			rel="noopener noreferrer"
		>
			<div className="grid flex-shrink-0 place-items-center">{icon}</div>
			<span className="text-[1.125rem] truncate">{label}</span>
		</a>
	);
};

interface SidebarNavInfoButtonProps {
	disabled?: boolean;
	/** Placement, when the entry has to keep the button out of the flow. */
	className?: string;
}

/**
 * The entry's help dialog, behind a `?` that shows on hover (always, when the
 * entry is disabled and the dialog is all it has to offer). It may render
 * inside the entry's link, next to a key badge, so its clicks, and those in
 * the dialog it opens, never reach the link: the dialog portal still bubbles
 * React events to the link.
 */
export const SidebarNavInfoButton = (
	props: PropsWithChildren<SidebarNavInfoButtonProps>
) => {
	const { children, disabled, className } = props;
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
						? 'text-primary visible pointer-events-auto'
						: 'opacity-0 invisible group-hover:visible group-hover:opacity-100',
					'transition-opacity duration-300 delay-0',
					'group-hover:pointer-events-auto',
					className
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
							{children}
						</DialogContent>
					</DialogOverlay>
				</DialogPortal>
			</Dialog>
		</>
	);
};

export const SidebarNavLinkWrapper = ({
	label,
	children
}: {
	label: string;
	children: ReactNode;
}) => {
	const { isSidebarOpen: isSidebarOpenRaw } = useSidebar();
	const isSidebarOpen = !!isSidebarOpenRaw;

	return (
		<Tooltip
			content={label}
			side="right"
			delayDuration={isSidebarOpen ? 1400 : 700}
			sideOffset={15}
			disabled={isSidebarOpen}
		>
			<div className="flex-grow min-w-0">{children}</div>
		</Tooltip>
	);
};
