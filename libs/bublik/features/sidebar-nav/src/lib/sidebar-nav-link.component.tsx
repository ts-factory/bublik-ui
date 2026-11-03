/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	ReactNode,
	forwardRef,
	createContext,
	useContext,
	type MouseEvent
} from 'react';

import {
	cn,
	Icon,
	Tooltip,
	useSidebar,
	sidebarPaddingTransition,
	type IconProps
} from '@/shared/tailwind-ui';

import {
	SidebarNavLinkInternalProps,
	SidebarNavLinkExternalProps
} from './sidebar-nav.types';
import { linkStyles } from './sidebar-nav.styles';
import { toString } from './sidebar-nav.utils';

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

	if (LinkComponent) {
		return (
			<LinkComponent
				ref={ref as React.Ref<HTMLAnchorElement>}
				to={to}
				className={className}
				style={style}
				onClick={onClick}
			>
				{content}
			</LinkComponent>
		);
	}

	return (
		<a
			ref={ref as React.Ref<HTMLAnchorElement>}
			href={toString(to)}
			className={className}
			style={style}
			onClick={onClick}
		>
			{content}
		</a>
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

export interface SidebarNavInfoButtonProps {
	/** The docs section that explains the entry. */
	href: string;
	/** What those docs cover, for its accessible name. */
	label: string;
	disabled?: boolean;
	/** Placement, when the entry has to keep the button out of the flow. */
	className?: string;
}

/**
 * Opens the entry's docs in a new tab, from a `?` that shows on hover (always,
 * when the entry is disabled and its docs are all it has to offer). It renders
 * inside the entry's link, so it is a button rather than a nested anchor, which
 * HTML does not allow, and its clicks never reach that link.
 */
export const SidebarNavInfoButton = (props: SidebarNavInfoButtonProps) => {
	const { href, label, disabled, className } = props;
	const { isSidebarOpen } = useSidebar();

	if (!isSidebarOpen) return null;

	const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		window.open(href, '_blank', 'noopener,noreferrer');
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			data-info-button
			aria-label={`Open ${label} docs`}
			className={cn(
				'rounded ml-auto p-0.5 hover:bg-primary-wash hover:text-primary',
				disabled
					? 'text-primary pointer-events-auto visible opacity-100'
					: 'opacity-0 invisible group-hover:visible group-hover:opacity-100',
				'transition-opacity duration-300 delay-0',
				'group-hover:pointer-events-auto',
				className
			)}
		>
			<Icon name="InformationCircleQuestionMark" size={20} />
		</button>
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
