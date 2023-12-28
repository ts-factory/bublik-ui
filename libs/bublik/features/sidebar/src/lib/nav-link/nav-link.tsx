/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode, useEffect, useState } from 'react';
import { type LinkProps, Link } from 'react-router-dom';

import { Icon, Tooltip, cn, cva, useSidebar } from '@/shared/tailwind-ui';

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

export interface NavLinkProps extends Pick<LinkProps, 'to'> {
	label: string;
	icon: ReactNode;
	pattern?: MatchPattern | MatchPattern[];
	subitems?: AccordionLinkProps[];
}

export const NavLink = (props: NavLinkProps) => {
	const { label, to, icon, subitems = [], pattern } = props;

	const { isSidebarOpen } = useSidebar();
	const { isActive, to: finalTo } = useNavLink({ to, pattern });

	const hasSubitems = subitems.length > 0;

	const [isOpen, toggleOpen] = useState<boolean | null>(isActive);
	const isSubmenuOpen = isOpen && hasSubitems;

	const handleToggle = () => toggleOpen(!isOpen);

	useEffect(() => {
		if (isActive) toggleOpen(true);
	}, [isActive, isSidebarOpen]);

	useEffect(() => {
		if (!isSidebarOpen && !isActive) {
			toggleOpen(false);
		}
	}, [isActive, isSidebarOpen]);

	return (
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
						wrapperStyles({ isActive, isSubmenuOpen: Boolean(isSubmenuOpen) }),
						'transition-[margin-bottom]',
						isSubmenuOpen ? 'mb-3.5' : 'delay-200 mb-0'
					)}
				>
					<Link
						to={finalTo}
						className={linkStyles({ isSidebarOpen })}
						style={paddingTransition}
					>
						<div className="grid flex-shrink-0 place-items-center">{icon}</div>
						<span className="text-[1.125rem] truncate">{label}</span>
					</Link>
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
							<li key={item.label}>
								<AccordionLink {...item} />
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
};

const accordionLinkStyles = cva({
	base: ['flex items-center rounded-[10px] py-1.5 h-full gap-3.5'],
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

export type AccordionLinkProps = Omit<NavLinkProps, 'subitems'>;

const AccordionLink = (props: AccordionLinkProps) => {
	const { label, icon, pattern, to } = props;

	const { isSidebarOpen } = useSidebar();
	const { to: matchTo, isActive } = useAccordionLink({ pattern, to });

	return (
		<Tooltip
			content={label}
			side="right"
			delayDuration={isSidebarOpen ? 1400 : 700}
			sideOffset={15}
		>
			<Link
				to={matchTo}
				className={accordionLinkStyles({ isActive, isSidebarOpen })}
				style={paddingTransition}
			>
				<div className="grid place-items-center">{icon}</div>
				<span className="truncate text-[0.875rem] leading-[1.5rem]">
					{label}
				</span>
			</Link>
		</Tooltip>
	);
};
