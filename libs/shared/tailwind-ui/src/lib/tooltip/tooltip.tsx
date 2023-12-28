/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import * as RadixTooltip from '@radix-ui/react-tooltip';

import { cva } from '../utils';

const tooltipContentStyles = cva({
	base: [
		'rounded-lg',
		'py-3 px-4',
		'shadow-tooltip',
		'text-[0.6875rem]',
		'font-medium',
		'leading-[0.875rem]',
		'bg-white',
		'z-50',
		'rdx-state-delayed-open:rdx-side-top:animate-slide-down-fade',
		'rdx-state-delayed-open:rdx-side-right:animate-slide-left-fade',
		'rdx-state-delayed-open:rdx-side-bottom:animate-slide-up-fade',
		'rdx-state-delayed-open:rdx-side-left:animate-slide-right-fade',
		'rdx-state-closed:rdx-side-top:animate-fade-out',
		'rdx-state-closed:rdx-side-right:animate-fade-out',
		'rdx-state-closed:rdx-side-bottom:animate-fade-out',
		'rdx-state-closed:rdx-side-left:animate-fade-out'
	]
});

export type TooltipTypesValue = 'primary' | 'secondary';

export type TooltipProps = RadixTooltip.TooltipProps & {
	content: string | number;
	disabled?: boolean;
	side?: RadixTooltip.TooltipContentProps['side'];
	sideOffset?: RadixTooltip.TooltipContentProps['sideOffset'];
	align?: RadixTooltip.TooltipContentProps['align'];
	alignOffset?: RadixTooltip.TooltipContentProps['alignOffset'];
};

export const Tooltip = (props: TooltipProps) => {
	const {
		open,
		disabled,
		content,
		side,
		sideOffset,
		align,
		alignOffset,
		children,
		...restProps
	} = props;

	return (
		<RadixTooltip.Root open={disabled ? false : open} {...restProps}>
			<RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
			<RadixTooltip.Portal>
				<RadixTooltip.Content
					className={tooltipContentStyles()}
					side={side}
					sideOffset={sideOffset}
					align={align}
					alignOffset={alignOffset}
				>
					{content}
					<RadixTooltip.Arrow className="fill-white" />
				</RadixTooltip.Content>
			</RadixTooltip.Portal>
		</RadixTooltip.Root>
	);
};

export const TooltipProvider = RadixTooltip.Provider;
