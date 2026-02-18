/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentPropsWithRef, forwardRef } from 'react';
import { format } from 'date-fns';

import { cn } from '../utils';
import { Icon } from '../icon';

const TIME_FORMAT = 'kk:mm:ss';

export interface ClockProps extends ComponentPropsWithRef<'button'> {
	time: Date;
	dateFormat?: string;
}

export const Clock = forwardRef<HTMLButtonElement, ClockProps>(
	({ time, dateFormat, className, ...props }, ref) => {
		const formattedDate = format(time, dateFormat || TIME_FORMAT);

		return (
			<button
				className={cn(
					'flex items-center justify-center gap-1 border-y border-l border-border-primary rounded-md px-3 py-[7px] transition-colors w-28',
					className
				)}
				{...props}
				ref={ref}
				data-testid="tw-clock"
			>
				<Icon name="Clock" className="grid place-items-center text-primary" />
				<time
					className="text-[0.875rem] font-medium leading-[1.5rem]"
					dateTime={formattedDate}
				>
					{formattedDate}
				</time>
			</button>
		);
	}
);
Clock.displayName = 'Clock';
