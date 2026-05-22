/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { cva } from 'cva';

export const wrapperStyles = cva({
	base: ['flex', 'rounded-[0.625rem]', 'transition-colors', 'items-center'],
	variants: {
		isActive: {
			true: 'bg-primary text-white hover:text-white hover:bg-primary',
			false: 'text-text-menu hover:text-primary'
		},
		isSubmenuOpen: { true: '' },
		disabled: {
			true: 'opacity-60 cursor-not-allowed pointer-events-none'
		}
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

export const toggleWrapperStyles = cva({
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

export const linkStyles = cva({
	base: 'flex py-[7px] min-w-0 flex-grow gap-3.5',
	variants: {
		isSidebarOpen: { true: 'pl-4', false: 'pl-[7px]' },
		disabled: { true: 'cursor-not-allowed opacity-60 pointer-events-none' }
	}
});

export const listWrapperStyles = cva({
	base: 'transition-all rounded-lg delay-500 duration-500',
	variants: { isSubmenuOpen: { true: 'bg-primary-wash' } }
});

export const accordionLinkStyles = cva({
	base: ['flex items-center rounded-[10px] py-1.5 h-full gap-3.5 group'],
	variants: {
		isSidebarOpen: {
			true: 'ml-11 pl-3 pr-[18px]',
			false: 'px-[9px]'
		},
		isActive: {
			true: 'bg-[#ecf1ff] text-[#385bf9]',
			false: 'text-text-menu hover:text-primary'
		},
		disabled: { true: 'cursor-not-allowed hover:text-text-menu' }
	}
});

export const submenuGuideListStyles = cva({
	base: [
		'flex flex-col gap-3 relative',
		'before:absolute before:left-[29px] before:-top-10 before:h-10 before:w-0.5 before:rounded-full before:content-[""] before:pointer-events-none'
	],
	variants: {
		isSidebarOpen: {
			true: '',
			false: 'before:hidden'
		},
		tone: {
			active: 'before:bg-primary',
			inactive: 'before:bg-border-primary/80'
		}
	}
});

export const submenuGuideItemStyles = cva({
	base: [
		'relative',
		'[&:has(~_[data-sidebar-nav-submenu-guide-active=true])_[data-sidebar-nav-guide-stem]]:bg-primary',
		'[&[data-sidebar-nav-submenu-guide-active=true]_[data-sidebar-nav-guide-stem-top]]:bg-primary',
		'[&:last-child_[data-sidebar-nav-guide-stem-bottom]]:hidden'
	],
	variants: {
		isSidebarOpen: {
			true: '',
			false: '[&_[data-sidebar-nav-guide-part]]:hidden'
		}
	}
});

export const submenuGuideStemStyles = cva({
	base: [
		'absolute left-[29px] w-0.5 bg-border-primary/80 pointer-events-none z-0'
	],
	variants: {
		segment: {
			top: 'top-[-1px] h-[calc(50%-0.625rem+1px)]',
			bottom: 'top-[calc(50%-10px)] bottom-[calc(-0.75rem-1px)]'
		}
	}
});

export const submenuGuideBranchStyles = cva({
	base: [
		'absolute left-[29px] top-[calc(50%-0.625rem)] h-2.5 w-3 rounded-bl-[0.625rem] border-b-2 border-l-2 pointer-events-none z-10'
	],
	variants: {
		tone: {
			active: 'border-primary',
			inactive: 'border-border-primary/80',
			disabled: 'border-border-primary/50'
		}
	}
});

export const paddingTransition = { transition: 'padding 0.5s ease' };
