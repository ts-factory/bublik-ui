/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ComponentPropsWithRef, forwardRef } from 'react';

import { Icon, IconProps } from '../icon';
import { cn } from '../utils';

type RootProps = ComponentPropsWithRef<'div'>;

const Root = forwardRef<HTMLDivElement, RootProps>(
	({ className, ...props }, ref) => {
		return (
			<div
				className={cn('grid h-full w-full place-items-center', className)}
				ref={ref}
				{...props}
			/>
		);
	}
);

type ContentProps = ComponentPropsWithRef<'div'>;

const Content = forwardRef<HTMLDivElement, ContentProps>(
	({ className, ...props }, ref) => {
		return (
			<div
				className={cn('flex flex-col items-center text-center', className)}
				ref={ref}
				{...props}
			/>
		);
	}
);

interface StateIconProps extends Omit<IconProps, 'name'> {
	name?: IconProps['name'];
}

const StateIcon = forwardRef<SVGSVGElement, StateIconProps>(
	(
		{ name = 'TriangleExclamationMark', className, size = 24, ...props },
		ref
	) => {
		return (
			<Icon
				name={name}
				size={size}
				className={cn('text-text-unexpected', className)}
				ref={ref}
				{...props}
			/>
		);
	}
);

type TitleProps = ComponentPropsWithRef<'h3'>;

const Title = forwardRef<HTMLHeadingElement, TitleProps>(
	({ className, children, ...props }, ref) => {
		return (
			<h3
				className={cn('mt-2 text-sm font-medium text-gray-900', className)}
				ref={ref}
				{...props}
			>
				{children}
			</h3>
		);
	}
);

type DescriptionProps = ComponentPropsWithRef<'p'>;

const Description = forwardRef<HTMLParagraphElement, DescriptionProps>(
	({ className, ...props }, ref) => {
		return (
			<p
				className={cn('mt-1 text-sm text-gray-500', className)}
				ref={ref}
				{...props}
			/>
		);
	}
);

type ListProps = ComponentPropsWithRef<'ul'>;

const List = forwardRef<HTMLUListElement, ListProps>(
	({ className, ...props }, ref) => {
		return (
			<ul
				className={cn(
					'mt-2 w-full list-disc space-y-1 pl-5 text-left text-sm text-gray-500',
					className
				)}
				ref={ref}
				{...props}
			/>
		);
	}
);

type ListItemProps = ComponentPropsWithRef<'li'>;

const ListItem = forwardRef<HTMLLIElement, ListItemProps>(
	({ className, ...props }, ref) => {
		return <li className={cn(className)} ref={ref} {...props} />;
	}
);

type ActionsProps = ComponentPropsWithRef<'div'>;

const Actions = forwardRef<HTMLDivElement, ActionsProps>(
	({ className, ...props }, ref) => {
		return <div className={cn('mt-4', className)} ref={ref} {...props} />;
	}
);

const State = {
	Root,
	Content,
	Icon: StateIcon,
	Title,
	Description,
	List,
	ListItem,
	Actions
};

export { State };
