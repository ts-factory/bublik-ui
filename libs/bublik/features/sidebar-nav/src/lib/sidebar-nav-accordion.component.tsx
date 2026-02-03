/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { Children, isValidElement, type MouseEventHandler, type ReactNode, type ComponentType } from 'react';
import type { To } from 'react-router-dom';

import { cn, Tooltip, useSidebar } from '@/shared/tailwind-ui';
import { accordionLinkStyles, paddingTransition } from './sidebar-nav.styles';
import { toString } from './sidebar-nav.utils';

function getLabelTextFromChildren(children: ReactNode): string {
	let labelText = '';

	Children.forEach(children, (child) => {
		if (isValidElement(child) && child.type === SidebarAccordionLabel) {
			const labelContent = child.props.children;
			if (typeof labelContent === 'string') {
				labelText = labelContent;
			} else if (typeof labelContent === 'number') {
				labelText = String(labelContent);
			}
		}
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

	if (disabled) {
		return (
			<Tooltip
				content={labelText}
				side="right"
				delayDuration={isSidebarOpen ? 1400 : 700}
				sideOffset={15}
			>
				<div className={cn(className, 'group')} style={style}>
					{children}
				</div>
			</Tooltip>
		);
	}

	if ('href' in props) {
		return (
			<Tooltip
				content={labelText}
				side="right"
				delayDuration={isSidebarOpen ? 1400 : 700}
				sideOffset={15}
			>
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
			<Tooltip
				content={labelText}
				side="right"
				delayDuration={isSidebarOpen ? 1400 : 700}
				sideOffset={15}
			>
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
		<Tooltip
			content={labelText}
			side="right"
			delayDuration={isSidebarOpen ? 1400 : 700}
			sideOffset={15}
		>
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

export function SidebarAccordionLabel({ children, className }: SidebarAccordionLabelProps) {
	return (
		<span
			className={cn(
				'truncate text-[0.875rem] leading-[1.5rem]',
				className
			)}
		>
			{children}
		</span>
	);
}
