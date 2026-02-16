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
		isSidebarOpen: { true: 'px-[18px]', false: 'px-[9px]' },
		isActive: {
			true: 'bg-[#ecf1ff] text-[#385bf9]',
			false: 'text-text-menu hover:text-primary'
		},
		disabled: { true: 'cursor-not-allowed hover:text-text-menu' }
	}
});

export const paddingTransition = { transition: 'padding 0.5s ease' };
