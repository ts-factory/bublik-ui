/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { ComponentType, MouseEventHandler, ReactNode } from 'react';
import { useState } from 'react';
import { useLocation, type To } from 'react-router-dom';

import { Dialog, DialogPortal, ModalContent } from '@/shared/tailwind-ui';

import { SidebarAccordionLink } from './sidebar-nav-accordion.component';
import { getSubmenuIsActive, type SubmenuMatchPattern } from './sidebar-nav.matchers';

type SidebarNavSubmenuItemProps = {
	label: string;
	icon: ReactNode;
	isActive: boolean;
	disabled?: boolean;
	dialogContent?: ReactNode;
	openDialogOnDisabled?: boolean;
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
	const {
		label,
		icon,
		isActive,
		disabled,
		dialogContent,
		openDialogOnDisabled = true
	} = props;
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
		if (disabled) {
			event.preventDefault();
			if (openDialogOnDisabled && dialogContent) {
				setIsDialogOpen(true);
			}
		}
	};

	const onDialogOpen =
		openDialogOnDisabled && disabled && dialogContent
			? () => setIsDialogOpen(true)
			: undefined;

	const linkProps =
		'href' in props
			? { href: props.href }
			: { to: props.to, linkComponent: props.linkComponent };

	return (
		<>
			<SidebarAccordionLink
				label={label}
				icon={icon}
				isActive={isActive}
				disabled={disabled}
				onClick={handleClick}
				dialogContent={dialogContent}
				onDialogOpen={onDialogOpen}
				{...linkProps}
			/>
			{openDialogOnDisabled && dialogContent ? (
				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogPortal>
						<ModalContent>{dialogContent}</ModalContent>
					</DialogPortal>
				</Dialog>
			) : null}
		</>
	);
}

interface SidebarNavSubmenuItemContainerProps {
	label: string;
	to: string;
	icon: ReactNode;
	disabled?: boolean;
	dialogContent?: ReactNode;
	openDialogOnDisabled?: boolean;
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
	label,
	to,
	icon,
	disabled,
	dialogContent,
	openDialogOnDisabled = true,
	pattern,
	linkComponent
}: SidebarNavSubmenuItemContainerProps) {
	const location = useLocation();

	const isActive = pattern ? getSubmenuIsActive(location, pattern) : true;

	return (
		<SidebarNavSubmenuItem
			label={label}
			icon={icon}
			to={to}
			isActive={isActive}
			disabled={disabled}
			dialogContent={dialogContent}
			openDialogOnDisabled={openDialogOnDisabled}
			linkComponent={linkComponent}
		/>
	);
}
