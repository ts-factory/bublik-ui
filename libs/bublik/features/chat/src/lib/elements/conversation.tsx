/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ComponentProps } from 'react';
import { ArrowDownIcon } from 'lucide-react';
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom';

import { cn } from '@/shared/tailwind-ui';

/**
 * Scrollable message area that follows the stream while the user is at the
 * bottom and stays put once they scroll up (use-stick-to-bottom). The root is
 * the scroll container; `ConversationScrollButton` overlays it.
 */
export function Conversation({
	className,
	...props
}: ComponentProps<typeof StickToBottom>) {
	return (
		<StickToBottom
			role="log"
			initial="smooth"
			resize={undefined}
			className={cn('relative flex-1 overflow-y-auto', className)}
			{...props}
		/>
	);
}

export function ConversationContent({
	className,
	...props
}: ComponentProps<typeof StickToBottom.Content>) {
	return (
		// `scrollClassName` targets the inner element that actually scrolls (the
		// `scrollRef` div), so the scrollbar styling lands on the real scrollbar.
		// `styled-scrollbar` sizes it to 8px in WebKit; `[scrollbar-width:thin]`
		// forces a thin bar in Firefox (which ignores the WebKit width). The
		// floating composer is inset (`right-3`) to clear this thin bar in both
		// engines so it stays visible.
		<StickToBottom.Content
			scrollClassName="styled-scrollbar [scrollbar-width:thin]"
			className={cn('px-6 py-4', className)}
			{...props}
		/>
	);
}

/** Floating pill that appears when scrolled away from the live bottom edge. */
export function ConversationScrollButton({
	className
}: {
	className?: string;
}) {
	const { isAtBottom, scrollToBottom } = useStickToBottomContext();

	if (isAtBottom) return null;

	return (
		<button
			type="button"
			aria-label="Scroll to bottom"
			onClick={() => scrollToBottom()}
			className={cn(
				'absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-border-primary bg-white p-2 text-text-primary transition-colors hover:bg-primary-wash hover:text-primary',
				className
			)}
		>
			<ArrowDownIcon className="size-4" />
		</button>
	);
}
