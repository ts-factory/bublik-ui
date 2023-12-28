/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef } from 'react';
import {
	Dialog,
	DialogContent,
	DialogOverlay,
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

export const DrawerContent = forwardRef<HTMLDivElement, DialogContentProps>(
	({ className, children, ...props }, ref) => {
		return (
			<>
				<DialogOverlay className={dialogOverlayStyles()} />
				<DialogContent
					{...props}
					className={cn(
						'fixed top-0 right-0 z-50 h-screen bg-white rdx-state-open:animate-drawer-slide-in-right rdx-state-closed:animate-drawer-slide-out-right',
						className
					)}
					ref={ref}
				>
					{children}
				</DialogContent>
			</>
		);
	}
);
