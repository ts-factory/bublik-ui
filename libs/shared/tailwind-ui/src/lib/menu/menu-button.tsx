/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef } from 'react';
import {
	AriaMenuProps,
	useMenu,
	useMenuItem,
	useMenuSection,
	useMenuTrigger,
	useSeparator
} from 'react-aria';
import {
	MenuTriggerProps,
	TreeState,
	useMenuTriggerState,
	useTreeState
} from 'react-stately';
import { Node } from '@react-types/shared';

import { Popover, PopoverContent, PopoverTrigger } from '../popover';

interface MenuSectionProps<T> {
	section: Node<T>;
	state: TreeState<T>;
	onAction?: (key: string | number | bigint) => void;
	onClose?: () => void;
}

const MenuSection = <T extends object>({
	section,
	state,
	onAction,
	onClose
}: MenuSectionProps<T>) => {
	const { itemProps, headingProps, groupProps } = useMenuSection({
		heading: section.rendered,
		'aria-label': section['aria-label']
	});

	const { separatorProps } = useSeparator({ elementType: 'li' });

	return (
		<>
			{section.key !== state.collection.getFirstKey() && (
				<li
					{...separatorProps}
					style={{
						borderTop: '1px solid gray',
						margin: '2px 5px'
					}}
				/>
			)}
			<li {...itemProps}>
				{section.rendered && (
					<span
						{...headingProps}
						style={{
							fontWeight: 'bold',
							fontSize: '1.1em',
							padding: '2px 5px'
						}}
					>
						{section.rendered}
					</span>
				)}
				<ul
					{...groupProps}
					style={{
						padding: 0,
						listStyle: 'none'
					}}
				>
					{[...section.childNodes].map((node) => (
						<MenuItem
							key={node.key}
							item={node}
							state={state}
							onAction={(e) => onAction?.(e)}
							onClose={onClose}
						/>
					))}
				</ul>
			</li>
		</>
	);
};

export interface MenuItemProps<T> {
	item: Node<T>;
	state: TreeState<T>;
	onAction?: (key: React.Key) => void;
	onClose?: () => void;
}

export const MenuItem = <T,>({ item, state }: MenuItemProps<T>) => {
	const ref = useRef(null);
	const { menuItemProps, isFocused, isSelected, isDisabled } = useMenuItem(
		{ key: item.key },
		state,
		ref
	);

	return (
		<li
			{...menuItemProps}
			ref={ref}
			style={{
				background: isFocused ? 'gray' : 'transparent',
				color: isDisabled ? 'gray' : isFocused ? 'white' : 'black',
				padding: '2px 5px',
				outline: 'none',
				cursor: 'default',
				display: 'flex',
				justifyContent: 'space-between'
			}}
		>
			{item.rendered}
			{isSelected && <span aria-hidden="true">✅</span>}
		</li>
	);
};

interface MenuProps<T extends object> extends AriaMenuProps<T> {
	onClose?: () => void;
	onAction?: (key: string | number | bigint) => void;
}
export const Menu = <T extends Record<string, unknown>>(
	props: MenuProps<T>
) => {
	const ref = useRef(null);
	const state = useTreeState(props);
	const { menuProps } = useMenu(props, state, ref);

	return (
		<ul
			{...menuProps}
			ref={ref}
			style={{
				margin: 0,
				padding: 0,
				listStyle: 'none',
				width: 150
			}}
		>
			{[...state.collection].map((item) => (
				<MenuSection
					key={item.key}
					section={item}
					state={state}
					onAction={(key) => props.onAction?.(key)}
					onClose={props.onClose}
				/>
			))}
		</ul>
	);
};

interface MenuButtonProps<T extends object>
	extends AriaMenuProps<T>,
		MenuTriggerProps {
	label: string;
}

export const MenuButton = <T extends object>(props: MenuButtonProps<T>) => {
	const ref = useRef(null);
	const state = useMenuTriggerState(props);
	const { menuTriggerProps, menuProps } = useMenuTrigger({}, state, ref);

	return (
		<Popover onOpenChange={state.setOpen} open={state.isOpen}>
			<PopoverTrigger asChild>
				<button
					{...menuTriggerProps}
					ref={ref}
					style={{ height: 30, fontSize: 14 }}
				>
					{props.label}
					<span aria-hidden="true" style={{ paddingLeft: 5 }}>
						▼
					</span>
				</button>
			</PopoverTrigger>
			<PopoverContent
				className="bg-white rounded-lg shadow-popover p-2"
				onEscapeKeyDown={() => state.setOpen(false)}
			>
				{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
				{/* @ts-ignore */}
				<Menu<T> {...props} {...menuProps} />
			</PopoverContent>
		</Popover>
	);
};
