/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import React, { useRef } from 'react';
import { Key, useListBox, useListBoxSection, useOption } from 'react-aria';
import type { AriaListBoxOptions } from '@react-aria/listbox';
import type { ListState } from 'react-stately';
import type { Node } from '@react-types/shared';

import { cva } from '../utils';

interface ListBoxProps extends AriaListBoxOptions<unknown> {
	listBoxRef?: React.RefObject<HTMLUListElement>;
	state: ListState<unknown>;
}

interface SectionProps {
	section: Node<unknown>;
	state: ListState<unknown>;
}

interface OptionProps {
	item: Node<unknown>;
	state: ListState<unknown>;
}

export const ListBox = (props: ListBoxProps) => {
	const ref = useRef<HTMLUListElement>(null);
	const { listBoxRef = ref, state } = props;
	const { listBoxProps } = useListBox(props, state, listBoxRef);

	return (
		<ul
			{...listBoxProps}
			className="w-full h-full overflow-y-scroll bg-white rounded-t-sm outline-none max-h-72 rounded-b-md shadow-popover"
			ref={listBoxRef}
		>
			{Array.from(state.collection).map((item) => {
				return item.type === 'section' ? (
					<ListBoxSection key={item.key} section={item} state={state} />
				) : (
					<Option key={item.key} item={item} state={state} />
				);
			})}
		</ul>
	);
};

const ListBoxSection = ({ section, state }: SectionProps) => {
	const { itemProps, headingProps, groupProps } = useListBoxSection({
		heading: section.rendered,
		'aria-label': section['aria-label']
	});

	return (
		<li {...itemProps} className="pt-2">
			{section.rendered && (
				<span
					{...headingProps}
					className="text-[0.6875rem] font-medium leading-[0.875rem] text-text-menu uppercase px-4 pt-3 pb-2"
				>
					{section.rendered}
				</span>
			)}
			<ul {...groupProps}>
				{[...section.childNodes].map((node) => (
					<Option key={node.key} item={node} state={state} />
				))}
			</ul>
		</li>
	);
};

const optionStyles = cva({
	base: [
		'py-2',
		'px-4',
		'outline-none',
		'cursor-default',
		'flex',
		'items-center',
		'justify-between',
		'text-[0.6875rem]',
		'font-medium',
		'leading-[0.875rem]',
		'text-text-primary'
	],
	variants: {
		isFocused: { true: 'text-text-primary bg-[#ECF1FF]' },
		isSelected: { true: 'bg-[#ECF1FF] text-text-primary' },
		isDisabled: { true: '' }
	}
});

const Option = ({ item, state }: OptionProps) => {
	const ref = useRef<HTMLLIElement>(null);
	const { optionProps, isDisabled, isSelected, isFocused } = useOption(
		{ key: item.key as Key },
		state,
		ref
	);

	return (
		<li
			{...optionProps}
			ref={ref}
			className={optionStyles({ isDisabled, isFocused, isSelected })}
		>
			{item.rendered}
		</li>
	);
};
