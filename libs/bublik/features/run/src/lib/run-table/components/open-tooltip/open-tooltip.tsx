/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentPropsWithRef, FC } from 'react';

import { HoverCard } from '@/shared/tailwind-ui';

export type OpenTooltipProps = ComponentPropsWithRef<'button'>;

export const OpenTooltip: FC<OpenTooltipProps> = ({ children, ...props }) => {
	return (
		<HoverCard
			content={
				<button
					className="flex items-center gap-[22px] py-1.5 px-2.5 bg-white rounded shadow-popover hover:text-primary"
					{...props}
				>
					<span className="text-[0.625rem] font-semibold leading-[0.875rem]">
						Open
					</span>
					<span className="text-[0.625rem] font-semibold leading-[0.875rem]">
						Ctrl+click
					</span>
				</button>
			}
			side="top"
			sideOffset={5}
			openDelay={0}
			arrow
		>
			{children}
		</HoverCard>
	);
};
