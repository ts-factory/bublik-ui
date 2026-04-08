/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	PropsWithChildren,
	ReactNode,
	useState,
	forwardRef,
	createContext,
	useContext
} from 'react';

import {
	cn,
	Icon,
	Tooltip,
	useSidebar,
	Dialog,
	DialogPortal,
	ModalContent,
	type IconProps
} from '@/shared/tailwind-ui';

import {
	SidebarNavLinkInternalProps,
	SidebarNavLinkExternalProps
} from './sidebar-nav.types';
import { linkStyles, paddingTransition } from './sidebar-nav.styles';
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
				disabled && 'cursor-not-allowed opacity-60 pointer-events-none'
			)}
		>
			<Icon {...props} />
		</div>
	);
}

function SidebarNavInternalLinkLabel({ children }: { children: ReactNode }) {
	const { disabled } = useSidebarNavInternalLink();
	return (
		<span
			className={cn(
				'text-[1.125rem] truncate',
				disabled && 'cursor-not-allowed opacity-60 pointer-events-none'
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
	const style = paddingTransition;

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
			disabled={isSidebarOpen}
		>
			<div className="flex-grow min-w-0">{children}</div>
		</Tooltip>
	);
};
