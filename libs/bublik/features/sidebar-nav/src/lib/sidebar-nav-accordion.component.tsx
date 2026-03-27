/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	Children,
	isValidElement,
	type MouseEventHandler,
	type ReactNode,
	type ComponentType
} from 'react';
import type { To } from 'react-router-dom';

import { cn, Tooltip, useSidebar } from '@/shared/tailwind-ui';
import { accordionLinkStyles, paddingTransition } from './sidebar-nav.styles';
import { toString } from './sidebar-nav.utils';

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
	const { children, isActive, disabled } = props;

	const { isSidebarOpen: isSidebarOpenRaw } = useSidebar();
	const isSidebarOpen = !!isSidebarOpenRaw;

	const className = accordionLinkStyles({ isActive, isSidebarOpen, disabled });
	const style = paddingTransition;

	const labelText = getLabelTextFromChildren(children);
	const tooltipProps = {
		content: labelText,
		side: 'right' as const,
		delayDuration: isSidebarOpen ? 1400 : 700,
		sideOffset: 15,
		disabled: isSidebarOpen
	};

	if (disabled) {
		return (
			<Tooltip {...tooltipProps}>
				<div className={cn(className, 'group')} style={style}>
					{children}
				</div>
			</Tooltip>
		);
	}

	if ('href' in props) {
		return (
			<Tooltip {...tooltipProps}>
				<a
					href={props.href}
					target="_blank"
					rel="noopener noreferrer"
					className={cn(className, 'group')}
					style={style}
				>
					{children}
				</a>
			</Tooltip>
		);
	}

	const LinkComponent = props.linkComponent;

	if (LinkComponent) {
		return (
			<Tooltip {...tooltipProps}>
				<LinkComponent
					to={props.to}
					className={cn(className, 'group')}
					style={style}
					onClick={props.onClick}
				>
					{children}
				</LinkComponent>
			</Tooltip>
		);
	}

	return (
		<Tooltip {...tooltipProps}>
			<a
				href={toString(props.to)}
				className={cn(className, 'group')}
				style={style}
				onClick={props.onClick}
			>
				{children}
			</a>
		</Tooltip>
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
