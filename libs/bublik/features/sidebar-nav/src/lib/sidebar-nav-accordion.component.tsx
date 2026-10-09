/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	Children,
	isValidElement,
	type MouseEventHandler,
	type ReactNode,
	type ComponentType
} from 'react';
import type { To } from '@/router';

import {
	cn,
	HoverCard,
	sidebarPaddingTransition,
	Tooltip,
	useSidebar
} from '@/shared/tailwind-ui';
import { accordionLinkStyles } from './sidebar-nav.styles';
import { SidebarNavRouterLink } from './sidebar-nav-router-link.component';

function getNodeText(node: ReactNode): string {
	if (typeof node === 'string' || typeof node === 'number') {
		return String(node).trim();
	}

	if (!isValidElement<{ children?: ReactNode }>(node)) {
		return '';
	}

	const childNodes = node.props.children;
	if (!childNodes) {
		return '';
	}

	let text = '';
	Children.forEach(childNodes, (child) => {
		if (text) return;
		text = getNodeText(child);
	});

	return text;
}

function getLabelTextFromChildren(children: ReactNode): string {
	let labelText = '';

	Children.forEach(children, (child) => {
		if (labelText) return;
		labelText = getNodeText(child);
	});

	return labelText;
}

type SidebarAccordionLinkLocalProps = {
	children: ReactNode;
	isActive: boolean;
	disabled?: boolean;
	/**
	 * Shown to the right on hover while the sidebar is collapsed, in place of
	 * the label tooltip.
	 */
	collapsedHoverContent?: ReactNode;
	/** Shifts the hover card along the row, e.g. to line an item up with it. */
	collapsedHoverAlignOffset?: number;
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
			onClick?: MouseEventHandler<HTMLAnchorElement>;
	  }
	| { href: string }
);

export const SidebarAccordionLink = (props: SidebarAccordionLinkLocalProps) => {
	const {
		children,
		isActive,
		disabled,
		collapsedHoverContent,
		collapsedHoverAlignOffset
	} = props;

	const { isSidebarOpen: isSidebarOpenRaw } = useSidebar();
	const isSidebarOpen = !!isSidebarOpenRaw;

	const className = accordionLinkStyles({ isActive, isSidebarOpen, disabled });
	const style = sidebarPaddingTransition;

	const labelText = getLabelTextFromChildren(children);

	// The wrapper must not depend on `isSidebarOpen`: swapping it remounts the
	// row, and a fresh row has no padding to transition from, so it jumps.
	const withHint = (node: ReactNode) =>
		collapsedHoverContent ? (
			<HoverCard
				content={collapsedHoverContent}
				side="right"
				align="start"
				alignOffset={collapsedHoverAlignOffset}
				sideOffset={10}
				openDelay={200}
				closeDelay={100}
				arrow
				keepOpenOnTriggerPress
				disabled={isSidebarOpen}
			>
				{node}
			</HoverCard>
		) : (
			<Tooltip
				content={labelText}
				side="right"
				delayDuration={isSidebarOpen ? 1400 : 700}
				sideOffset={15}
				disabled={isSidebarOpen}
			>
				{node}
			</Tooltip>
		);

	if (disabled) {
		return withHint(
			<div className={cn(className, 'group')} style={style}>
				{children}
			</div>
		);
	}

	if ('href' in props) {
		return withHint(
			<a
				href={props.href}
				target="_blank"
				rel="noopener noreferrer"
				className={cn(className, 'group')}
				style={style}
			>
				{children}
			</a>
		);
	}

	const LinkComponent = props.linkComponent ?? SidebarNavRouterLink;

	return withHint(
		<LinkComponent
			to={props.to}
			className={cn(className, 'group')}
			style={style}
			onClick={props.onClick}
		>
			{children}
		</LinkComponent>
	);
};

interface SidebarAccordionLabelProps {
	children: ReactNode;
	className?: string;
}

export function SidebarAccordionLabel({
	children,
	className
}: SidebarAccordionLabelProps) {
	return (
		<span
			className={cn('truncate text-[0.875rem] leading-[1.5rem]', className)}
		>
			{children}
		</span>
	);
}
