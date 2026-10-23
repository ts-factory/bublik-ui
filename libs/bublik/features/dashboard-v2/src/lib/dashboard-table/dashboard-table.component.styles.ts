/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { cva } from '@/shared/tailwind-ui';

/**
 * The table is one CSS grid per list. Rows are `display: contents`, so the
 * cells are the grid items and carry the row's border, background, corners
 * and hover state. The header cells are sticky grid items pinned below the
 * date picker.
 */

/** 34px picker plus the 4px gap under it, hidden by the picker's padding. */
export const DATE_PICKER_HEIGHT = 38;

export const datePickerStyles = cva({
	base: 'sticky top-0 z-40 pb-1 bg-bg-body'
});

export const gridStyles = cva({
	// content-start: in the split layout the two grids stretch to the same
	// height, and a grid taller than its rows would spread the slack between
	// them as extra gaps.
	base: 'grid content-start'
});

export const rowStyles = cva({
	base: 'contents group'
});

export const headerCellStyles = cva({
	base: [
		// min-w-0: a header never holds a track open, its label truncates.
		'sticky z-30 h-8.5 min-w-0 bg-bg-primary',
		'text-[0.6875rem] font-semibold',
		'flex items-center'
	],
	variants: {
		align: { left: 'justify-start', right: 'justify-end' },
		padded: { true: 'px-0.5', false: '' }
	},
	defaultVariants: { align: 'left', padded: true }
});

export const bodyCellStyles = cva({
	base: [
		// 36px: the old 34px row plus the 1px border that was on its wrapper.
		'mt-1 h-9 flex items-center',
		'text-[0.75rem] font-medium leading-[1.125rem]',
		'border-y border-bg-primary transition-colors group-hover:border-primary'
	],
	variants: {
		// The resting border takes the fill's colour, so an error row is not
		// framed by a 1px line of the white surface inside its tint.
		isRowError: {
			true: 'bg-bg-fillError border-bg-fillError',
			false: 'bg-bg-primary'
		},
		isExpanded: {
			true: 'border-primary border-b-transparent group-hover:border-b-transparent',
			false: ''
		},
		edge: {
			first: 'border-l rounded-tl-md',
			last: 'border-r rounded-tr-md',
			middle: ''
		},
		align: { left: 'justify-start', right: 'justify-end' },
		padded: { true: 'px-0.5', false: 'relative' },
		/** Text cells may shrink below their content; numeric badges do not. */
		shrinks: { true: 'min-w-0', false: '' },
		isFetching: { true: 'pointer-events-none opacity-40', false: '' }
	},
	compoundVariants: [
		{ edge: 'first', isExpanded: false, class: 'rounded-bl-md' },
		{ edge: 'last', isExpanded: false, class: 'rounded-br-md' }
	],
	defaultVariants: {
		isRowError: false,
		isExpanded: false,
		edge: 'middle',
		align: 'left',
		padded: true,
		shrinks: false,
		isFetching: false
	}
});

export const subrowStyles = cva({
	base: [
		'col-span-full relative border-x border-b border-primary rounded-b-md',
		// It spans every track, so its content's min-content width would be
		// spread over the min-content tracks: a run strip of a few hundred
		// pieces (one gap each) pushed the grid past the page. With no
		// intrinsic width of its own it just stretches across the row.
		'[contain:inline-size]'
	],
	variants: {
		isFetching: { true: 'pointer-events-none opacity-40', false: '' }
	},
	defaultVariants: { isFetching: false }
});
