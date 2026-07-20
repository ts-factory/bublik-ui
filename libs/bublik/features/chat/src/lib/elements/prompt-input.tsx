/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	ButtonHTMLAttributes,
	FormHTMLAttributes,
	KeyboardEvent,
	ReactNode,
	TextareaHTMLAttributes
} from 'react';
import { ArrowUpIcon, Loader2Icon, SquareIcon } from 'lucide-react';

import { cn } from '@/shared/tailwind-ui';

/** `useChat().status` — drives the submit button icon. */
export type PromptInputStatus = 'ready' | 'submitted' | 'streaming' | 'error';

export function PromptInput({
	className,
	...props
}: FormHTMLAttributes<HTMLFormElement>) {
	return (
		<form
			className={cn(
				'divide-y divide-border-primary rounded-xl border border-border-primary bg-white',
				className
			)}
			{...props}
		/>
	);
}

export function PromptInputTextarea({
	className,
	onKeyDown,
	...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
	function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
		onKeyDown?.(e);
		if (e.defaultPrevented) return;
		if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
			e.preventDefault();
			e.currentTarget.form?.requestSubmit();
		}
	}
	return (
		<textarea
			rows={2}
			onKeyDown={handleKeyDown}
			className={cn(
				'w-full resize-none bg-transparent border-none px-4 py-3 text-[0.875rem] text-text-primary placeholder:text-text-menu outline-none focus:outline-none focus:ring-0',
				className
			)}
			{...props}
		/>
	);
}

export function PromptInputToolbar({
	className,
	children
}: {
	className?: string;
	children: ReactNode;
}) {
	return (
		<div className={cn('flex items-center justify-between p-2', className)}>
			{children}
		</div>
	);
}

export function PromptInputTools({
	className,
	children
}: {
	className?: string;
	children: ReactNode;
}) {
	return (
		<div className={cn('flex items-center gap-1', className)}>{children}</div>
	);
}

/**
 * Submit button whose icon tracks the run lifecycle: send arrow when idle,
 * spinner while the request is being submitted, stop square while streaming
 * (the caller flips it to `type="button"` + `onClick={stop}` then).
 */
export function PromptInputSubmit({
	status,
	className,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { status: PromptInputStatus }) {
	return (
		<button
			aria-label={
				status === 'streaming' || status === 'submitted' ? 'Stop' : 'Send'
			}
			className={cn(
				'flex size-8 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary/90 disabled:bg-border-primary disabled:text-text-menu',
				className
			)}
			{...props}
		>
			{status === 'submitted' ? (
				<Loader2Icon className="size-4 animate-spin" />
			) : status === 'streaming' ? (
				<SquareIcon className="size-3.5 fill-current" />
			) : (
				<ArrowUpIcon className="size-4" />
			)}
		</button>
	);
}
