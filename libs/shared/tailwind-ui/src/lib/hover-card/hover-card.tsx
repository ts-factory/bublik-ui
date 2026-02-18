/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode } from 'react';
import * as RadixHoverCard from '@radix-ui/react-hover-card';

import { cva } from '../utils';

const hoverCardContentStyles = cva({
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
		...restProps
	} = props;

	return (
		<RadixHoverCard.Root open={disabled ? false : open} {...restProps}>
			<RadixHoverCard.Trigger asChild>{children}</RadixHoverCard.Trigger>

			<RadixHoverCard.Portal container={container}>
				<RadixHoverCard.Content
					className={hoverCardContentStyles()}
					side={side}
					sideOffset={sideOffset}
					align={align}
					collisionPadding={8}
				>
					{content}
					{arrow && <RadixHoverCard.Arrow className="fill-white" />}
				</RadixHoverCard.Content>
			</RadixHoverCard.Portal>
		</RadixHoverCard.Root>
	);
};
