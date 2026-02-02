/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { MouseEventHandler, ReactNode, ComponentType } from 'react';
import type { To } from 'react-router-dom';

import { cn, Icon, Tooltip, useSidebar } from '@/shared/tailwind-ui';
import { accordionLinkStyles, paddingTransition } from './sidebar-nav.styles';
import { toString } from './sidebar-nav.utils';

type SidebarAccordionLinkLocalProps = {
	label: string;
	icon: ReactNode;
	isActive: boolean;
	dialogContent?: ReactNode;
	onDialogOpen?: () => void;
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
	const { label, icon, isActive, dialogContent, onDialogOpen, disabled } =
		props;

	const { isSidebarOpen: isSidebarOpenRaw } = useSidebar();
	const isSidebarOpen = !!isSidebarOpenRaw;

	const className = accordionLinkStyles({ isActive, isSidebarOpen, disabled });
	const style = paddingTransition;

	const content = (
		<>
			<div
				className={cn(
					'grid place-items-center',
					disabled && 'cursor-not-allowed opacity-60 pointer-events-none'
				)}
			>
				{icon}
			</div>
			<span
				className={cn(
					'truncate text-[0.875rem] leading-[1.5rem]',
					disabled && 'cursor-not-allowed opacity-60 pointer-events-none'
				)}
			>
				{label}
			</span>
			{dialogContent && onDialogOpen && (
				<button
					onClick={(e) => {
						e.stopPropagation();
						onDialogOpen();
					}}
					className={[
						'rounded ml-auto p-0.5 hover:bg-primary-wash hover:text-primary',
						disabled
							? 'text-primary visible pointer-events-auto'
							: 'opacity-0 invisible group-hover:visible group-hover:opacity-100',
						'transition-opacity duration-300 delay-0',
						'group-hover:pointer-events-auto'
					].join(' ')}
				>
					<Icon name="InformationCircleQuestionMark" size={20} />
				</button>
			)}
		</>
	);

	if (disabled) {
		return (
			<Tooltip
				content={label}
				side="right"
				delayDuration={isSidebarOpen ? 1400 : 700}
				sideOffset={15}
			>
				<div className={className} style={style}>
					{content}
				</div>
			</Tooltip>
		);
	}

	if ('href' in props) {
		return (
			<Tooltip
				content={label}
				side="right"
				delayDuration={isSidebarOpen ? 1400 : 700}
				sideOffset={15}
			>
				<a
					href={props.href}
					target="_blank"
					rel="noopener noreferrer"
					className={className}
					style={style}
				>
					{content}
				</a>
			</Tooltip>
		);
	}

	const LinkComponent = props.linkComponent;

	if (LinkComponent) {
		return (
			<Tooltip
				content={label}
				side="right"
				delayDuration={isSidebarOpen ? 1400 : 700}
				sideOffset={15}
			>
				<LinkComponent
					to={props.to}
					className={className}
					style={style}
					onClick={props.onClick}
				>
					{content}
				</LinkComponent>
			</Tooltip>
		);
	}

	return (
		<Tooltip
			content={label}
			side="right"
			delayDuration={isSidebarOpen ? 1400 : 700}
			sideOffset={15}
		>
			<a
				href={toString(props.to)}
				className={className}
				style={style}
				onClick={props.onClick}
			>
				{content}
			</a>
		</Tooltip>
	);
};
