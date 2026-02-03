/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { ComponentType, MouseEventHandler, ReactNode } from 'react';
import { Children, isValidElement } from 'react';
import { useLocation, type To } from 'react-router-dom';

import { cn } from '@/shared/tailwind-ui';

import { SidebarAccordionLink, SidebarAccordionLabel } from './sidebar-nav-accordion.component';
import { getSubmenuIsActive, type SubmenuMatchPattern } from './sidebar-nav.matchers';

// ============================
// Submenu Item Compound Components
// ============================

function SidebarNavSubmenuIcon({ children }: { children: ReactNode }) {
	return (
		<div className="grid flex-shrink-0 place-items-center">
			{children}
		</div>
	);
}

function SidebarNavSubmenuLabel({ children }: { children: ReactNode }) {
	return (
		<span className="truncate text-[0.875rem] leading-[1.5rem]">
			{children}
		</span>
	);
}

interface SidebarNavSubmenuInfoButtonProps {
	children: ReactNode;
	disabled?: boolean;
}

function SidebarNavSubmenuInfoButton({ children, disabled }: SidebarNavSubmenuInfoButtonProps) {
	return (
		<span data-info-button className={cn(disabled && 'disabled')}>
			{children}
		</span>
	);
}

// ============================
// Submenu Item Presentational Component
// ============================

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

export function SidebarNavSubmenuItem(props: SidebarNavSubmenuItemProps) {
	const { children, isActive, disabled } = props;

	const linkProps =
		'href' in props
			? { href: props.href }
			: { to: props.to, linkComponent: props.linkComponent };

	return (
		<SidebarAccordionLink isActive={isActive} disabled={disabled} {...linkProps}>
			{children}
		</SidebarAccordionLink>
	);
}

// ============================
// Submenu Item Container Component
// ============================

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
	disabled,
	pattern,
	linkComponent
}: SidebarNavSubmenuItemContainerProps) {
	const location = useLocation();
	const isActive = pattern ? getSubmenuIsActive(location, pattern) : true;

	// Process children to wrap components properly
	const processedChildren = Children.toArray(children).map((child) => {
		// If it's text/number content, wrap it as a label
		if (typeof child === 'string' || typeof child === 'number') {
			return <SidebarNavSubmenuLabel>{child}</SidebarNavSubmenuLabel>;
		}

		if (!isValidElement(child)) return child;

		// If it's already a label, return as is
		if (child.type === SidebarNavSubmenuLabel) {
			return child;
		}

		// If it's a SidebarAccordionLabel, we need to wrap it with proper styling
		if (child.type === SidebarAccordionLabel) {
			return (
				<SidebarNavSubmenuLabel>
					{child.props.children}
				</SidebarNavSubmenuLabel>
			);
		}

		// If it's a SidebarNavSubmenuInfoButton, pass it through as-is
		// It handles its own hover behavior using group classes
		if (child.type === SidebarNavSubmenuInfoButton) {
			return child;
		}

		// If it's an Icon component, wrap in icon container for consistent styling
		const childType = child.type as { displayName?: string; name?: string };
		if (childType?.displayName === 'Icon' || childType?.name === 'Icon') {
			return <SidebarNavSubmenuIcon>{child}</SidebarNavSubmenuIcon>;
		}

		// For all other elements, pass through as-is
		return child;
	});

	return (
		<SidebarNavSubmenuItem
			to={to}
			isActive={isActive}
			disabled={disabled}
			linkComponent={linkComponent}
		>
			{processedChildren}
		</SidebarNavSubmenuItem>
	);
}

// Attach compound components to the container
SidebarNavSubmenuItemContainer.Icon = SidebarNavSubmenuIcon;
SidebarNavSubmenuItemContainer.Label = SidebarNavSubmenuLabel;
SidebarNavSubmenuItemContainer.InfoButton = SidebarNavSubmenuInfoButton;
SidebarNavSubmenuItemContainer.SidebarAccordionLabel = SidebarAccordionLabel;
