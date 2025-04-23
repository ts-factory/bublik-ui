/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode, useEffect, useRef, useState } from 'react';
import { type LinkProps, Link, useSearchParams } from 'react-router-dom';

import {
	Icon,
	Tooltip,
	cn,
	cva,
	useSidebar,
	Dialog,
	ModalContent,
	DialogPortal
} from '@/shared/tailwind-ui';

import { MatchPattern, useAccordionLink, useNavLink } from './nav-link.hooks';

export type SidebarItem = NavLinkProps;

/**
|--------------------------------------------------
| STYLES
|--------------------------------------------------
*/

const wrapperStyles = cva({
	base: ['flex', 'rounded-[0.625rem]', 'transition-colors', 'items-center'],
	variants: {
		isActive: {
			true: 'bg-primary text-white hover:text-white hover:bg-primary',
			false: 'text-text-menu hover:text-primary'
		},
		isSubmenuOpen: { true: '' }
	},
	compoundVariants: [
		{
			isActive: false,
			isSubmenuOpen: true,
			className:
				'bg-[#ecf1ff] text-[#385bf9] hover:text-[#385bf9] hover:bg-[#ecf1ff]'
		}
	]
});

const toggleWrapperStyles = cva({
	base: [
		'py-[7px] pr-4 grid place-items-center rounded flex-shrink-0 [&_svg]:transition-transform [&_svg]:rounded'
	],
	variants: {
		isSubmenuOpen: { true: '[&_svg]:rotate-180', false: '[&_svg]:rotate-90' },
		isSidebarOpen: { false: 'hidden' },
		isActive: {
			true: '[&_svg]:hover:bg-white [&_svg]:hover:text-primary',
			false: '[&_svg]:hover:bg-primary-wash'
		}
	}
});

const linkStyles = cva({
	base: 'flex py-[7px] min-w-0 flex-grow gap-3.5',
	variants: { isSidebarOpen: { true: 'pl-4', false: 'pl-[7px]' } }
});

const listWrapperStyles = cva({
	base: 'transition-all rounded-lg delay-500 duration-500',
	variants: { isSubmenuOpen: { true: 'bg-primary-wash' } }
});

/**
|--------------------------------------------------
| ANIMATION
|--------------------------------------------------
*/

const paddingTransition = { transition: 'padding 0.5s ease' };

/**
|--------------------------------------------------
| NAV LINK
|--------------------------------------------------
*/

type NavLinkCommon = {
	label: string;
	icon: ReactNode;
	subitems?: AccordionLinkProps[];
	whenMatched?: boolean;
	dialogContent?: ReactNode;
};

export type NavLinkInternal = Pick<LinkProps, 'to'> &
	NavLinkCommon & {
		pattern?: MatchPattern | MatchPattern[];
	};

export type NavLinkExternal = NavLinkCommon & {
	href: string;
};

export type NavLinkProps = NavLinkInternal | NavLinkExternal;
export type AccordionLinkProps = NavLinkInternal | NavLinkExternal;

function useGetSearchWithProject(to: { pathname: string; search: string }) {
	const project = useSearchParams()[0].get('project');
	let fSearch = '';
	if (project) {
		const params = new URLSearchParams(to.search);
		params.set('project', project);
		fSearch = `?${params.toString()}`;
	}

	return {
		pathname: to.pathname,
		search: fSearch
	};
}

export const isExternalLink = (
	props: NavLinkProps | AccordionLinkProps
): props is NavLinkExternal => {
	return 'href' in props;
};

export const NavLink = (props: NavLinkProps) => {
	const { label, icon, subitems = [], whenMatched, dialogContent } = props;

	const { isSidebarOpen } = useSidebar();
	const { isActive, to } = useNavLink(
		isExternalLink(props) ? undefined : props
	);
	const finalTo = useGetSearchWithProject(to);

	const hasSubitems = subitems.length > 0;

	const [isOpen, toggleOpen] = useState<boolean | null>(isActive);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const isSubmenuOpen = isOpen && hasSubitems;

	const handleToggle = () => toggleOpen(!isOpen);
	const matchedOneTime = useRef(false);

	useEffect(() => {
		if (isActive) {
			toggleOpen(true);
			matchedOneTime.current = true;
		}
	}, [isActive, isSidebarOpen]);

	useEffect(() => {
		if (!isSidebarOpen && !isActive) {
			toggleOpen(false);
		}
	}, [isActive, isSidebarOpen]);

	const shouldShowDialog = whenMatched && !isActive && !matchedOneTime.current;

	const handleClick = (e: React.MouseEvent) => {
		if (shouldShowDialog) {
			e.preventDefault();
			setIsDialogOpen(true);
		}
	};

	const renderLink = () => {
		if (isExternalLink(props)) {
			return (
				<a
					href={props.href}
					className={linkStyles({ isSidebarOpen })}
					style={paddingTransition}
					target="_blank"
					rel="noopener noreferrer"
				>
					<div className="grid flex-shrink-0 place-items-center">{icon}</div>
					<span className="text-[1.125rem] truncate">{label}</span>
				</a>
			);
		}

		return (
			<Link
				to={finalTo}
				className={linkStyles({ isSidebarOpen })}
				style={paddingTransition}
				onClick={handleClick}
			>
				<div className="grid flex-shrink-0 place-items-center">{icon}</div>
				<span className="text-[1.125rem] truncate">{label}</span>
			</Link>
		);
	};

	return (
		<>
			<div
				className={listWrapperStyles({ isSubmenuOpen: Boolean(isSubmenuOpen) })}
			>
				<Tooltip
					content={label}
					side="right"
					delayDuration={isSidebarOpen ? 1400 : 700}
					sideOffset={15}
				>
					<div
						className={cn(
							wrapperStyles({
								isActive,
								isSubmenuOpen: Boolean(isSubmenuOpen)
							}),
							'transition-[margin-bottom] group relative',
							isSubmenuOpen ? 'mb-3.5' : 'delay-200 mb-0'
						)}
					>
						{renderLink()}
						{dialogContent && isSidebarOpen ? (
							<button
								onClick={() => setIsDialogOpen(true)}
								className={cn(
									'rounded p-0.5 hover:bg-primary-wash hover:text-primary opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-opacity duration-300 delay-0',
									!hasSubitems && 'mr-4'
								)}
							>
								<Icon name="InformationCircleQuestionMark" size={20} />
							</button>
						) : null}
						{hasSubitems ? (
							<button
								aria-label="Toggle submenu"
								className={toggleWrapperStyles({
									isSubmenuOpen: Boolean(isSubmenuOpen),
									isSidebarOpen,
									isActive
								})}
								onClick={handleToggle}
							>
								<Icon name="ArrowShortTop" />
							</button>
						) : null}
					</div>
				</Tooltip>

				{hasSubitems && (
					<div
						className={cn(
							'[&>ul]:overflow-hidden grid transition-all transform-gpu ease-in-out motion-reduce:transition-none',
							isSubmenuOpen
								? 'grid-rows-[1fr] duration-300'
								: 'grid-rows-[0fr] duration-500'
						)}
					>
						<ul className="flex flex-col gap-3">
							{subitems.map((item) => (
								<AccordionLink key={item.label} {...item} />
							))}
						</ul>
					</div>
				)}
			</div>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogPortal>
					<ModalContent>
						{dialogContent || (
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

const accordionLinkStyles = cva({
	base: ['flex items-center rounded-[10px] py-1.5 h-full gap-3.5 group'],
	variants: {
		isSidebarOpen: { true: 'px-[18px]', false: 'px-[9px]' },
		isActive: {
			true: 'bg-[#ecf1ff] text-[#385bf9]',
			false: 'text-text-menu hover:text-primary'
		}
	}
});

/**
|--------------------------------------------------
| ACCORDION LINK
|--------------------------------------------------
*/

const AccordionLink = (props: AccordionLinkProps) => {
	const { label, icon, whenMatched, dialogContent } = props;

	const { isSidebarOpen } = useSidebar();
	const { to, isActive, isPathMatch } = useAccordionLink(
		isExternalLink(props) ? undefined : props
	);
	const matchedOneTime = useRef(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const matchTo = useGetSearchWithProject(to);

	useEffect(() => {
		if (isActive) matchedOneTime.current = true;
	}, [isActive, isSidebarOpen]);

	const shouldShowDialog =
		whenMatched && !isActive && !matchedOneTime.current && !isPathMatch;

	const handleClick = (e: React.MouseEvent) => {
		if (shouldShowDialog) {
			e.preventDefault();
			setIsDialogOpen(true);
		}
	};

	if (shouldShowDialog) {
		return (
			<>
				<Tooltip
					content={label}
					side="right"
					delayDuration={isSidebarOpen ? 1400 : 700}
					sideOffset={15}
				>
					{isExternalLink(props) ? (
						<a
							href={props.href}
							target="_blank"
							rel="noopener noreferrer"
							className={accordionLinkStyles({ isActive, isSidebarOpen })}
							style={paddingTransition}
							onClick={handleClick}
						>
							<div className="grid place-items-center">{icon}</div>
							<span className="truncate text-[0.875rem] leading-[1.5rem]">
								{label}
							</span>
						</a>
					) : (
						<Link
							to={matchTo}
							className={accordionLinkStyles({
								isActive,
								isSidebarOpen
							})}
							style={paddingTransition}
							onClick={handleClick}
						>
							<div className="grid place-items-center">{icon}</div>
							<span className="truncate text-[0.875rem] leading-[1.5rem]">
								{label}
							</span>
							{dialogContent ? (
								<button
									onClick={() => setIsDialogOpen(true)}
									className="rounded ml-auto p-0.5 hover:bg-primary-wash pointer-events-none hover:text-primary opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-opacity duration-300 delay-0 group-hover:pointer-events-auto"
								>
									<Icon name="InformationCircleQuestionMark" size={20} />
								</button>
							) : null}
						</Link>
					)}
				</Tooltip>

				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogPortal>
						<ModalContent>
							{dialogContent || (
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
	}

	return (
		<>
			<Tooltip
				content={label}
				side="right"
				delayDuration={isSidebarOpen ? 1400 : 700}
				sideOffset={15}
			>
				{isExternalLink(props) ? (
					<a
						href={props.href}
						target="_blank"
						rel="noopener noreferrer"
						className={accordionLinkStyles({ isActive, isSidebarOpen })}
						style={paddingTransition}
					>
						<div className="grid place-items-center">{icon}</div>
						<span className="truncate text-[0.875rem] leading-[1.5rem]">
							{label}
						</span>
					</a>
				) : (
					<Link
						to={matchTo}
						className={accordionLinkStyles({
							isActive,
							isSidebarOpen,
							className: 'group'
						})}
						style={paddingTransition}
					>
						<div className="flex items-center gap-3.5">
							<div className="grid place-items-center">{icon}</div>
							<span className="truncate text-[0.875rem] leading-[1.5rem]">
								{label}
							</span>
						</div>
						{dialogContent ? (
							<button
								onClick={() => setIsDialogOpen(true)}
								className="rounded ml-auto p-0.5 hover:bg-primary-wash pointer-events-none hover:text-primary opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-opacity duration-300 delay-0 group-hover:pointer-events-auto"
							>
								<Icon name="InformationCircleQuestionMark" size={20} />
							</button>
						) : null}
					</Link>
				)}
			</Tooltip>
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogPortal>
					<ModalContent>
						{dialogContent || (
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
