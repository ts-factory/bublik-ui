/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';

export const Panel = DialogPrimitive.Root;
export const PanelTrigger = DialogPrimitive.Trigger;

export const PanelTitle = DialogPrimitive.Title;
export const PanelDescription = DialogPrimitive.Description;
export const PanelClose = DialogPrimitive.Close;

export interface PanelOverlayProps extends DialogPrimitive.DialogOverlayProps {
	isOpen?: boolean;
}

export const PanelOverlay = ({ isOpen, ...props }: PanelOverlayProps) => {
	return (
		<AnimatePresence>
			{isOpen && (
				<DialogPrimitive.Overlay asChild forceMount {...props}>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-40 bg-black bg-opacity-5"
					/>
				</DialogPrimitive.Overlay>
			)}
		</AnimatePresence>
	);
};

export interface PanelContentProps extends DialogPrimitive.DialogContentProps {
	isOpen: boolean;
}

export const PanelContent = ({ isOpen, ...props }: PanelContentProps) => {
	return (
		<AnimatePresence>
			{isOpen && (
				<DialogPrimitive.Content asChild forceMount {...props}>
					<motion.div
						initial={{ x: '100%' }}
						animate={{ x: '0%' }}
						exit={{ x: '100%' }}
						transition={{ type: 'tween' }}
						className="fixed top-0 right-0 z-50 h-screen bg-white"
					>
						{props.children}
					</motion.div>
				</DialogPrimitive.Content>
			)}
		</AnimatePresence>
	);
};

export interface SidePanelProps extends DialogPrimitive.DialogProps {
	trigger: ReactNode;
}

export const SidePanel = (props: SidePanelProps) => {
	const [isOpen, setIsOpen] = useState(
		props.open || props.defaultOpen || false
	);

	const handleOpenChange = (isOpen: boolean) => {
		setIsOpen(isOpen);
		props.onOpenChange?.(isOpen);
	};

	return (
		<Panel {...props} onOpenChange={handleOpenChange}>
			<PanelTrigger asChild>{props.trigger}</PanelTrigger>
			<PanelOverlay isOpen={isOpen} />
			<PanelContent isOpen={isOpen}>{props.children}</PanelContent>
		</Panel>
	);
};
