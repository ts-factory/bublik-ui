/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	ComponentProps,
	ComponentPropsWithoutRef,
	MouseEvent,
	PropsWithChildren,
	forwardRef
} from 'react';
import { mergeRefs } from '@react-aria/utils';
import { Slot } from '@radix-ui/react-slot';
import { DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { DndContext } from '@dnd-kit/core';

import { TagModel } from './tags-list.types';
import { TagsContextProvider, useTagContext } from './tags-list.context';
import { UseTagListState, useTagInputProps } from './tags-list.hooks';
import { cn } from '../utils';

export type RootProps = { state: UseTagListState };

export const Root = ({ state, children }: PropsWithChildren<RootProps>) => {
	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		const activeTag = active.data.current as TagModel;
		const overTag = over?.data.current as TagModel | undefined;

		if (!activeTag || !overTag) return;
		if (activeTag.id === overTag.id) return;

		state.tagDrop(activeTag, overTag);
	};

	return (
		<DndContext onDragEnd={handleDragEnd}>
			<TagsContextProvider value={state}>{children}</TagsContextProvider>
		</DndContext>
	);
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type ListProps = {
	asChild?: boolean;
};

export const List = ({
	children,
	asChild,
	...props
}: PropsWithChildren<ListProps & ComponentPropsWithoutRef<'ul'>>) => {
	const Component = asChild ? Slot : 'ul';

	return <Component {...props}>{children}</Component>;
};

export type ListItemProps = {
	tag: TagModel;
	asChild?: boolean;
	onTagClick?: (tag: TagModel) => void;
};

export const ListItem = forwardRef<
	HTMLLIElement,
	ListItemProps & ComponentProps<'li'>
>(({ tag, onClick, onTagClick, asChild, children, ...props }, ref) => {
	const Component = asChild ? Slot : 'li';
	const {
		attributes,
		listeners,
		setNodeRef: setDraggableRef,
		transform,
		isDragging
	} = useDraggable({
		id: tag.id,
		data: tag
	});

	const { setNodeRef: setDroppableRef, isOver } = useDroppable({
		id: tag.id,
		data: tag
	});

	const style = {
		transform: CSS.Translate.toString(transform),
		transition: CSS.Transition.toString({
			easing: 'ease',
			duration: 100,
			property: 'all'
		})
	};

	const handleClick =
		onClick || onTagClick
			? (e: MouseEvent<HTMLLIElement>) => {
					onClick?.(e);
					onTagClick?.(tag);
			  }
			: undefined;

	return (
		<Component
			{...props}
			onClick={handleClick}
			ref={mergeRefs(ref, setDraggableRef, setDroppableRef)}
			style={style}
			className={cn(isOver && 'bg-red-500', isDragging && 'bg-primary-wash')}
			{...listeners}
			{...attributes}
		>
			{children}
		</Component>
	);
});

export const DeleteButton = forwardRef<
	HTMLButtonElement,
	ComponentProps<'button'>
>(({ children, onClick, ...props }, ref) => {
	const api = useTagContext();

	const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
		onClick?.(e);
		// api.removeTag(tag)
	};

	return (
		<button {...props} onClick={handleClick} ref={ref}>
			{children}
		</button>
	);
});

export const TagInput = forwardRef<HTMLInputElement, ComponentProps<'input'>>(
	(props, ref) => {
		const state = useTagContext();
		const inputProps = useTagInputProps(state);

		return <input {...props} {...inputProps} ref={ref} />;
	}
);
