/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ButtonHTMLAttributes, forwardRef, ReactNode, Ref } from 'react';

import { cn } from '@/shared/tailwind-ui';

type MessageRole = 'user' | 'assistant';

export function Message({
	from,
	className,
	children
}: {
	from: MessageRole;
	className?: string;
	children: ReactNode;
}) {
	return (
		<div
			className={cn(
				'group flex flex-col gap-1 py-2',
				from === 'user' ? 'items-end' : 'items-start',
				className
			)}
		>
			{children}
		</div>
	);
}

/**
 * Hover-revealed action row under a message. Uses opacity (not `hidden`) so
 * there's no layout shift, and stays visible while a button inside has focus.
 */
export function MessageActions({
	className,
	children
}: {
	className?: string;
	children: ReactNode;
}) {
	return (
		<div
			className={cn(
				'flex items-center gap-1 opacity-0 transition-opacity',
				'group-hover:opacity-100 focus-within:opacity-100',
				className
			)}
		>
			{children}
		</div>
	);
}

function _MessageAction(
	props: ButtonHTMLAttributes<HTMLButtonElement>,
	ref: Ref<HTMLButtonElement>
) {
	const { className, children, ...rest } = props;

	return (
		<button
			type="button"
			className={cn(
				'flex items-center gap-1 rounded p-1 text-text-secondary transition-colors hover:bg-primary-wash hover:text-primary',
				className
			)}
			{...rest}
			ref={ref}
		>
			{children}
		</button>
	);
}

export const MessageAction = forwardRef(_MessageAction);

/** User turns render as a filled bubble; assistant turns as plain full-width text. */
export function MessageContent({
	from,
	className,
	children
}: {
	from: MessageRole;
	className?: string;
	children: ReactNode;
}) {
	return (
		<div
			className={cn(
				'text-[0.875rem]',
				from === 'user'
					? 'max-w-[80%] rounded-xl bg-primary-wash px-4 py-2 text-text-primary'
					: 'flex w-full flex-col gap-3 text-text-primary',
				className
			)}
		>
			{children}
		</div>
	);
}
