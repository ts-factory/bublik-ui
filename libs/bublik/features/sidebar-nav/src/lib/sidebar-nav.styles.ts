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
	base: ['flex items-center rounded-[10px] py-1.5 h-full gap-1 group'],
	variants: {
		isSidebarOpen: {
			true: 'ml-11 pl-3 pr-4',
			false: 'px-[9px]'
		},
		isActive: {
			true: 'bg-[#ecf1ff] text-[#385bf9]',
			false: 'text-text-menu hover:text-primary'
		},
		disabled: { true: 'cursor-not-allowed hover:text-text-menu' }
	}
});

export const submenuGuideContainerStyles = cva({
	base: [
		'relative',
		'before:absolute before:left-[29px] before:-top-2 before:h-2 before:w-0.5 before:rounded-t-full before:content-[""] before:pointer-events-none before:z-50 before:transition-opacity before:duration-300'
	],
	variants: {
		isSidebarOpen: {
			true: 'before:opacity-100 before:delay-700',
			false: 'before:opacity-0 before:delay-0'
		},
		isSubmenuOpen: {
			true: '',
			false: 'before:opacity-0 before:delay-0'
		},
		tone: {
			active: 'before:bg-primary',
			inactive: 'before:bg-border-primary/80'
		}
	}
});

export const submenuGuideListStyles = cva({
	base: ['flex flex-col gap-3 relative transition-colors duration-300'],
	variants: {
		isSidebarOpen: {
			true: '',
			false: 'bg-primary-wash rounded-lg delay-700'
		}
	}
});

export const submenuGuideItemStyles = cva({
	base: [
		'relative',
		'[&:has(~_[data-sidebar-nav-submenu-guide-active=true])_[data-sidebar-nav-guide-stem]]:bg-primary [&:has(~_[data-sidebar-nav-submenu-guide-active=true])_[data-sidebar-nav-guide-stem]]:z-20',
		'[&[data-sidebar-nav-submenu-guide-active=true]_[data-sidebar-nav-guide-stem-top]]:bg-primary [&[data-sidebar-nav-submenu-guide-active=true]_[data-sidebar-nav-guide-stem-top]]:z-20',
		'[&:last-child_[data-sidebar-nav-guide-stem-bottom]]:hidden'
	],
	variants: {
		isSidebarOpen: {
			true:
				'[&_[data-sidebar-nav-guide-part]]:opacity-100 [&_[data-sidebar-nav-guide-part]]:delay-700',
			false:
				'[&_[data-sidebar-nav-guide-part]]:opacity-0 [&_[data-sidebar-nav-guide-part]]:delay-0'
		}
	}
});

export const submenuGuideStemStyles = cva({
	base: [
		'absolute left-[29px] w-0.5 bg-border-primary/80 pointer-events-none z-10 transition-opacity duration-300'
	],
	variants: {
		segment: {
			top: 'top-[-1px] h-[calc(50%-0.625rem+3px)]',
			bottom: 'top-[calc(50%-10px)] bottom-[calc(-0.75rem-1px)]'
		}
	}
});

export const submenuGuideBranchStyles = cva({
	base: [
		'absolute left-[29px] top-[calc(50%-9px)] h-2.5 w-3 rounded-bl-[0.625rem] border-b-2 border-l-2 pointer-events-none transition-opacity duration-300'
	],
	variants: {
		tone: {
			active: 'border-primary z-20',
			inactive: 'border-border-primary/80 z-10',
			disabled: 'border-border-primary/50 z-10'
		}
	}
});

export const submenuGuideBranchExtensionStyles = cva({
	base: [
		'absolute left-[40px] top-1/2 h-0.5 w-[14px] -translate-y-1/2 rounded-full pointer-events-none transition-opacity duration-300'
	],
	variants: {
		tone: {
			active: 'bg-primary z-20',
			inactive: 'bg-border-primary/80 z-[-1]',
			disabled: 'bg-border-primary/50 z-[-1]'
		}
	}
});

export const paddingTransition = {
	transition: 'padding 0.5s ease, margin 0.5s ease'
};
