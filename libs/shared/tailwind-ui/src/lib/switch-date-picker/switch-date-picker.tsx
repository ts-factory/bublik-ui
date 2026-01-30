/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef, useRef, LegacyRef } from 'react';
import { useDatePickerState } from '@react-stately/datepicker';
import { useButton } from 'react-aria';
import { AriaDatePickerProps, useDatePicker } from '@react-aria/datepicker';
import { DateValue } from '@internationalized/date';
import { mergeRefs } from '@react-aria/utils';

import { Calendar } from './calendar';
import { DateField } from './date-field';
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
	PopoverTrigger
} from '../popover';
import { Icon } from '../icon';
import { Tooltip } from '../tooltip';

export const SwitchDatePicker = forwardRef<
	HTMLDivElement,
	AriaDatePickerProps<DateValue>
>((props, ref) => {
	const groupRef = useRef(null);
	const buttonRef = useRef(null);

	const state = useDatePickerState(props);
	const {
		groupProps,
		buttonProps: ariaButtonProps,
		fieldProps,
		dialogProps,
		calendarProps,
		labelProps
	} = useDatePicker(props, state, groupRef);

	const { buttonProps } = useButton(ariaButtonProps, buttonRef);

	const handlePrevClick = () => {
		if (state.dateValue) {
			state.setValue(state.dateValue.add({ days: -1 }));
		}
	};

	const handleNextClick = () => {
		if (state.dateValue) {
			state.setValue(state.dateValue.add({ days: 1 }));
		}
	};

	return (
		<Popover open={state.isOpen}>
			<PopoverAnchor className="relative flex gap-1 w-fit">
				<span className="sr-only" {...labelProps}>
					{props.label}
				</span>
				<Tooltip content="Previous day">
					<button
						className="rounded text-primary hover:bg-primary-wash"
						onClick={handlePrevClick}
						aria-label="Previous day"
					>
						<Icon name="ArrowShortTop" className="-rotate-90" />
					</button>
				</Tooltip>
				<div
					{...groupProps}
					ref={mergeRefs(groupRef, ref) as LegacyRef<HTMLDivElement>}
					className="flex gap-2"
				>
					<DateField {...fieldProps} />
					{state.validationState === 'invalid' && <div>Invalid</div>}
					<PopoverTrigger asChild>
						<button {...buttonProps} ref={buttonRef}>
							<Icon
								name="Calendar"
								size={20}
								className="transition-colors text-text-menu hover:text-primary"
							/>
						</button>
					</PopoverTrigger>
				</div>

				<Tooltip content="Next day">
					<button
						className="rounded text-primary hover:bg-primary-wash"
						onClick={handleNextClick}
						aria-label="Next day"
					>
						<Icon name="ArrowShortTop" className="rotate-90" />
					</button>
				</Tooltip>
			</PopoverAnchor>

			<PopoverContent
				className="px-8 py-6 bg-white rounded-xl shadow-popover"
				onInteractOutside={state.close}
				onEscapeKeyDown={state.close}
				{...dialogProps}
			>
				<Calendar {...calendarProps} />
			</PopoverContent>
		</Popover>
	);
});
