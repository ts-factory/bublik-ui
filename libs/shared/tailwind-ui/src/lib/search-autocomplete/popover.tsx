/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef } from 'react';
import { useOverlay, DismissButton, FocusScope } from 'react-aria';

interface PopoverProps {
	popoverRef?: React.RefObject<HTMLDivElement>;
	children: React.ReactNode;
	isOpen?: boolean;
	onClose: () => void;
}

export function Popover(props: PopoverProps) {
	const ref = useRef<HTMLDivElement>(null);
	const { popoverRef = ref, isOpen, onClose, children } = props;

	// Handle events that should cause the popup to close,
	// e.g. blur, clicking outside, or pressing the escape key.
	const { overlayProps } = useOverlay(
		{
			isOpen,
			onClose,
			shouldCloseOnBlur: true,
			isDismissable: false
		},
		popoverRef
	);

	// Add a hidden <DismissButton> component at the end of the popover
	// to allow screen reader users to dismiss the popup easily.
	return (
		<FocusScope restoreFocus>
			<div
				{...overlayProps}
				ref={popoverRef}
				className="absolute z-10 w-full mt-2 top-full"
			>
				{children}
				<DismissButton onDismiss={onClose} />
			</div>
		</FocusScope>
	);
}
