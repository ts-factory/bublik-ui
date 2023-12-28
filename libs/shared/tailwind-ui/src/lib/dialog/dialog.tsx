/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { forwardRef } from 'react';

import { cn, cva } from '../utils';

export const dialogOverlayStyles = cva({
	base: [
		'fixed',
		'inset-0',
		'bg-black',
		'bg-opacity-15',
		'backdrop-blur-sm',
		'z-40',
		'motion-safe:rdx-state-open:animate-fade-in',
		'motion-safe:rdx-state-closed:animate-fade-out'
	]
});

export const dialogContentStyles = cva({
	base: [
		'fixed',
		'top-1/2',
		'left-1/2',
		'transform',
		'-translate-x-1/2',
		'-translate-y-1/2',
		'max-h-[85vh]',
		'focus:outline-none',
		'motion-safe:rdx-state-open:animate-dialog-content-show',
		'motion-safe:rdx-state-closed:animate-dialog-content-hide',
		'z-50'
	]
});

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogContent = DialogPrimitive.Content;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
export const DialogClose = DialogPrimitive.Close;
export const DialogOverlay = DialogPrimitive.Overlay;
export const DialogPortal = DialogPrimitive.Portal;

export const ModalContent = forwardRef<
	HTMLDivElement,
	DialogPrimitive.DialogContentProps
>(({ className, ...props }, ref) => {
	return (
		<DialogOverlay className={dialogOverlayStyles()}>
			<DialogContent
				{...props}
				className={cn(dialogContentStyles(), className)}
				ref={ref}
			>
				{props.children}
			</DialogContent>
		</DialogOverlay>
	);
});
