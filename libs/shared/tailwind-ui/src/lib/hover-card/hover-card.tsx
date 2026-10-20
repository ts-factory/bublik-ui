/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode, useRef } from 'react';
import * as RadixHoverCard from '@radix-ui/react-hover-card';

import { cva } from '../utils';

export const hoverCardContentStyles = cva({
	base: [
		'z-50',
		'rdx-state-open:rdx-side-top:animate-slide-down-fade',
		'rdx-state-open:rdx-side-right:animate-slide-left-fade',
		'rdx-state-open:rdx-side-bottom:animate-slide-up-fade',
		'rdx-state-open:rdx-side-left:animate-slide-right-fade',
		'rdx-state-closed:rdx-side-top:animate-fade-out',
		'rdx-state-closed:rdx-side-right:animate-fade-out',
		'rdx-state-closed:rdx-side-bottom:animate-fade-out',
		'rdx-state-closed:rdx-side-left:animate-fade-out'
	]
});

export interface HoverCardProps extends RadixHoverCard.HoverCardProps {
	children?: ReactNode;
	content?: ReactNode;
	arrow?: boolean;
	side?: RadixHoverCard.HoverCardContentProps['side'];
	sideOffset?: RadixHoverCard.HoverCardContentProps['sideOffset'];
	container?: RadixHoverCard.HoverCardPortalProps['container'];
	disabled?: boolean;
	align?: RadixHoverCard.HoverCardContentProps['align'];
	alignOffset?: RadixHoverCard.HoverCardContentProps['alignOffset'];
	/**
	 * Keeps the card up when its trigger is pressed. Radix counts that press
	 * as one outside the card and dismisses it, then the trigger's focus opens
	 * it again, so a clickable trigger makes the card blink.
	 */
	keepOpenOnTriggerPress?: boolean;
}

export const HoverCard = (props: HoverCardProps) => {
	const {
		children,
		content,
		arrow,
		side,
		sideOffset,
		container,
		disabled,
		open,
		align,
		alignOffset,
		keepOpenOnTriggerPress,
		...restProps
	} = props;
	const triggerRef = useRef<HTMLAnchorElement>(null);

	return (
		<RadixHoverCard.Root open={disabled ? false : open} {...restProps}>
			<RadixHoverCard.Trigger asChild ref={triggerRef}>
				{children}
			</RadixHoverCard.Trigger>

			<RadixHoverCard.Portal container={container}>
				<RadixHoverCard.Content
					className={hoverCardContentStyles()}
					side={side}
					sideOffset={sideOffset}
					align={align}
					alignOffset={alignOffset}
					collisionPadding={8}
					onPointerDownOutside={(event) => {
						if (
							keepOpenOnTriggerPress &&
							event.target instanceof Node &&
							triggerRef.current?.contains(event.target)
						) {
							event.preventDefault();
						}
					}}
				>
					{content}
					{arrow && <RadixHoverCard.Arrow className="fill-white" />}
				</RadixHoverCard.Content>
			</RadixHoverCard.Portal>
		</RadixHoverCard.Root>
	);
};
