/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef } from 'react';
import type { ComboBoxProps } from '@react-types/combobox';
import { useComboBoxState } from 'react-stately';
import { useComboBox, useFilter, useButton } from 'react-aria';

import { ListBox } from './list-box';
import { Popover } from './popover';

export const ComboBox = <T extends object>(props: ComboBoxProps<T>) => {
	const { contains } = useFilter({ sensitivity: 'base' });
	const state = useComboBoxState({ ...props, defaultFilter: contains });

	const buttonRef = useRef(null);
	const inputRef = useRef(null);
	const listBoxRef = useRef(null);
	const popoverRef = useRef(null);

	const {
		buttonProps: triggerProps,
		inputProps,
		listBoxProps,
		labelProps
	} = useComboBox(
		{
			...props,
			inputRef,
			buttonRef,
			listBoxRef,
			popoverRef
		},
		state
	);

	const { buttonProps } = useButton(triggerProps, buttonRef);

	return (
		<div className="relative inline-flex flex-col">
			<label
				{...labelProps}
				className="block text-sm font-medium text-left text-gray-700"
			>
				{props.label}
			</label>
			<div
				className={`relative inline-flex flex-row rounded-md overflow-hidden shadow-sm border-2 ${
					state.isFocused ? 'border-pink-500' : 'border-gray-300'
				}`}
			>
				<input
					{...inputProps}
					ref={inputRef}
					className="px-3 py-1 outline-none"
				/>
				<button
					{...buttonProps}
					ref={buttonRef}
					className={`px-1 bg-gray-100 cursor-default border-l-2 ${
						state.isFocused
							? 'border-pink-500 text-pink-600'
							: 'border-gray-300 text-gray-500'
					}`}
				>
					{/* <ChevronDownIcon className="w-5 h-5" aria-hidden="true" /> */}
				</button>
			</div>
			{state.isOpen && (
				<Popover
					popoverRef={popoverRef}
					isOpen={state.isOpen}
					onClose={state.close}
				>
					<ListBox {...listBoxProps} listBoxRef={listBoxRef} state={state} />
				</Popover>
			)}
		</div>
	);
};
