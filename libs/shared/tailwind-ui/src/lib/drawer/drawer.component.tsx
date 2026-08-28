/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef } from 'react';
import {
	Dialog,
	DialogContent,
	DialogOverlay,
	DialogPortal,
	DialogTrigger,
	dialogOverlayStyles
} from '../dialog';
import {
	DialogContentProps,
	DialogProps,
	DialogTriggerProps
} from '@radix-ui/react-dialog';
import { cn } from '../utils';

export const DrawerRoot = (props: DialogProps) => {
	return <Dialog {...props} />;
};

export const DrawerTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(
	(props, ref) => {
		return <DialogTrigger {...props} ref={ref} />;
	}
);

export const DrawerContent = forwardRef<
	HTMLDivElement,
	// portal escapes the trigger's stacking context (e.g. a table row) so rows
	// can't paint over the drawer. Opt-in to keep the inline behavior other
	// callers rely on.
	DialogContentProps & { portal?: boolean }
>(({ className, children, portal, ...props }, ref) => {
	const content = (
		<>
			<DialogOverlay className={dialogOverlayStyles()} />
			<DialogContent
				{...props}
				className={cn(
					// The panel is white and so is most of what it covers — a drawer over
					// the log preview is white on white. The hairline carries the edge;
					// `shadow-dialog-sheet` (5%) is too soft to do it alone.
					'fixed top-0 right-0 z-50 h-screen h-svh bg-white border-l border-border-primary shadow-dialog-sheet rdx-state-open:animate-drawer-slide-in-right rdx-state-closed:animate-drawer-slide-out-right',
					className
				)}
				ref={ref}
			>
				{children}
			</DialogContent>
		</>
	);

	// Portal (to document.body) escapes the trigger's stacking context so the
	// drawer layers above the table instead of behind it.
	return portal ? <DialogPortal>{content}</DialogPortal> : content;
});
