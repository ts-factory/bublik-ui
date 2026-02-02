/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { PropsWithChildren, ReactNode, useState, forwardRef } from 'react';
import type { To } from 'react-router-dom';

import {
	cn,
	Icon,
	Tooltip,
	useSidebar,
	Dialog,
	DialogPortal,
	ModalContent
} from '@/shared/tailwind-ui';

import {
	SidebarNavLinkInternalProps,
	SidebarNavLinkExternalProps
} from './sidebar-nav.types';
import { linkStyles, paddingTransition } from './sidebar-nav.styles';

function toString(to: To): string {
	if (typeof to === 'string') return to;
	return `${to.pathname}${to.search ? `?${to.search}` : ''}${
		to.hash ? `#${to.hash}` : ''
	}`;
}

export const SidebarNavInternalLink = forwardRef<
	HTMLAnchorElement | HTMLDivElement,
	Omit<SidebarNavLinkInternalProps, 'isSidebarOpen'> & {
		children?: ReactNode;
	}
>(
	(
		{ label, icon, to, linkComponent: LinkComponent, onClick, children, disabled },
		ref
	) => {
		const { isSidebarOpen: isSidebarOpenRaw } = useSidebar();
		const isSidebarOpen = !!isSidebarOpenRaw;

		const content = (
			<>
				<div
					className={cn(
						'grid flex-shrink-0 place-items-center',
						disabled && 'cursor-not-allowed opacity-60 pointer-events-none'
					)}
				>
					{icon}
				</div>
				<span
					className={cn(
						'text-[1.125rem] truncate',
						disabled && 'cursor-not-allowed opacity-60 pointer-events-none'
					)}
				>
					{label}
				</span>
				{children}
			</>
		);

		const className = linkStyles({ isSidebarOpen, disabled });
		const style = paddingTransition;

		if (disabled) {
			return (
				<div ref={ref as React.Ref<HTMLDivElement>} className={cn(className)} style={style}>
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
			style={paddingTransition}
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
}

export const SidebarNavInfoButton = (
	props: PropsWithChildren<SidebarNavInfoButtonProps>
) => {
	const { children, disabled } = props;
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const { isSidebarOpen } = useSidebar();

	if (!children || !isSidebarOpen) return null;

	return (
		<>
			<button
				onClick={() => setIsDialogOpen(true)}
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
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogPortal>
					<ModalContent>
						{children || (
							<div className="bg-white p-6 rounded-lg">
								<h2 className="text-lg font-semibold mb-4">Not Available</h2>
								<p>This section is not available yet.</p>
							</div>
						)}
					</ModalContent>
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
		>
			{children}
		</Tooltip>
	);
};
