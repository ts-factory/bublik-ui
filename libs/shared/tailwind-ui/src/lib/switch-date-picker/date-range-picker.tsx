/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { createContext, forwardRef, Ref, useContext, useRef } from 'react';
import { formatDuration, intervalToDuration } from 'date-fns';
import { useDateRangePicker, AriaDateRangePickerProps } from 'react-aria';
import {
	DateRangePickerState,
	DateRangePickerStateOptions,
	useDateRangePickerState
} from 'react-stately';
import { mergeRefs } from '@react-aria/utils';
import {
	DateValue,
	getLocalTimeZone,
	isSameDay,
	today
} from '@internationalized/date';

import { useControllableState } from '@/shared/hooks';

import { DateField } from './date-field';
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
	PopoverTrigger
} from '../popover';
import { RangeCalendar } from './range-calendar';
import { Button } from './calendar';
import { cn } from '../utils';
import { Icon } from '../icon';
import { DateRange } from './types';
import { DEFAULT_RANGES } from './constants';
import { ButtonTw } from '../button';

type AddedProps = {
	ranges?: DateRange[];
	hideLabel?: boolean;
	onModeChange?: (mode: DateRangePickerMode) => void;
	enabledModes?: DateRangePickerMode[];
};

export type DateRangePickerMode = 'default' | 'duration';

type DateRangePickerContext = {
	mode: DateRangePickerMode;
	state: DateRangePickerState;
	setMode?: (mode: DateRangePickerMode) => void;
};

const DateRangePickerContext = createContext<
	DateRangePickerContext | undefined
>(undefined);

function useDatePickerContext() {
	const context = useContext(DateRangePickerContext);

	return context;
}

type DefaultDateRangePickerProps = AriaDateRangePickerProps<DateValue> &
	AddedProps & { mode?: 'default' };

type DurationDateRangePickerProps = AriaDateRangePickerProps<DateValue> &
	AddedProps & { mode?: 'duration' };

export type DateRangePickerProps =
	| DefaultDateRangePickerProps
	| DurationDateRangePickerProps;

function DateRangePicker(
	props: DateRangePickerProps,
	ref: Ref<HTMLDivElement>
) {
	const enabledModes = props.enabledModes ?? ['default'];
	const [mode = 'default', setMode] = useControllableState({
		defaultProp: props?.mode ?? 'default',
		prop: props?.mode,
		onChange: props?.onModeChange
	});

	const groupRef = useRef<HTMLDivElement>(null);

	const maxValue =
		props.mode === 'duration' ? today(getLocalTimeZone()) : props.maxValue;

	const finalProps: DateRangePickerStateOptions<DateValue> = {
		...props,
		maxValue
	};

	const state = useDateRangePickerState(finalProps);

	const {
		groupProps,
		labelProps,
		startFieldProps,
		endFieldProps,
		buttonProps,
		dialogProps,
		calendarProps
	} = useDateRangePicker(finalProps, state, groupRef);

	const ranges = props?.ranges || DEFAULT_RANGES;

	const pickerContext: DateRangePickerContext = {
		mode,
		state,
		setMode
	};

	const moreThanOneModeEnabled = enabledModes.length > 1;

	return (
		<DateRangePickerContext.Provider value={pickerContext}>
			<Popover open={state.isOpen}>
				<PopoverAnchor className="relative flex w-full gap-1">
					<div className="relative inline-flex flex-col w-full text-left">
						<div className="flex items-center gap-1">
							<span
								{...labelProps}
								className={cn(
									'absolute top-[-11px] left-2 z-10 bg-white font-normal text-text-secondary text-[0.875rem]',
									props.hideLabel && 'sr-only'
								)}
							>
								{props.label}
							</span>
						</div>
						<div
							{...groupProps}
							ref={mergeRefs(groupRef, ref)}
							className="flex group"
						>
							<div
								className={cn(
									'relative flex items-center w-full h-10 px-2 transition-all bg-white border rounded-md border-border-primary group-hover:border-primary group-focus-within:border-primary group-focus-within:shadow-text-field group-active:shadow-none',
									state.isOpen && 'border-primary shadow-text-field'
								)}
							>
								<div className="flex items-center justify-between w-full h-full gap-2">
									<div className="flex items-center justify-between w-full h-full">
										<div className="flex items-center gap-4 pr-2">
											{state.isInvalid ? (
												<PopoverTrigger asChild>
													<Button {...buttonProps}>
														<Icon
															name="TriangleExclamationMark"
															size={24}
															className="text-text-unexpected"
														/>
													</Button>
												</PopoverTrigger>
											) : (
												<PopoverTrigger asChild>
													<Button {...buttonProps}>
														<Icon
															name="Calendar"
															className="transition-colors text-text-menu hover:text-primary"
														/>
													</Button>
												</PopoverTrigger>
											)}
										</div>
										{mode === 'default' ? (
											<>
												<DateField {...startFieldProps} underline />
												<span aria-hidden="true" className="px-2">
													–
												</span>
												<DateField {...endFieldProps} underline />
											</>
										) : (
											mode === 'duration' && (
												<div className="flex items-center">
													<span className="text-[0.875rem] font-medium leading-[1.5rem]">
														{state.value?.start && state.value.end
															? `Last ${formatDuration(
																	intervalToDuration({
																		start: state.value?.start.toDate(
																			getLocalTimeZone()
																		),
																		end: state.value?.end.toDate(
																			getLocalTimeZone()
																		)
																	})
															  )}`
															: 'No Interval'}
													</span>
												</div>
											)
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</PopoverAnchor>
				<PopoverContent
					className="p-4 bg-white flex flex-col gap-4 rounded-lg shadow-popover"
					alignOffset={8}
					onInteractOutside={state.close}
					onEscapeKeyDown={state.close}
					sideOffset={8}
					{...dialogProps}
				>
					<RangeCalendar
						{...calendarProps}
						mode={mode}
						enabledModes={enabledModes}
					/>
					{ranges && ranges.length ? (
						<DateRangesHelper
							state={state}
							ranges={ranges}
							moreThanOneModeEnabled={moreThanOneModeEnabled}
							mode={mode}
							setMode={setMode}
						/>
					) : null}
				</PopoverContent>
			</Popover>
		</DateRangePickerContext.Provider>
	);
}

interface DateRangesHelperProps {
	state: DateRangePickerState;
	ranges: DateRange[];
	moreThanOneModeEnabled: boolean;
	mode: DateRangePickerMode;
	setMode: (mode: DateRangePickerMode) => void;
}

function DateRangesHelper(props: DateRangesHelperProps) {
	const { state, ranges, moreThanOneModeEnabled, setMode, mode } = props;

	return (
		<div
			className={cn('flex flex-col border-t border-border-primary gap-2 pt-2')}
		>
			<span
				className={cn(
					moreThanOneModeEnabled ? 'inline' : 'hidden',
					'text-sm font-semibold'
				)}
			>
				{moreThanOneModeEnabled ? 'Sliding' : 'Fixed'}
			</span>
			<ul className="flex items-center gap-4">
				{ranges.map(({ label, range }) => {
					const finalLabel = moreThanOneModeEnabled ? `Last ${label}` : label;
					const isActive =
						mode === 'duration' &&
						range?.start &&
						range.end &&
						state.dateRange?.start &&
						state.dateRange.end &&
						isSameDay(range?.start, state.dateRange?.start) &&
						isSameDay(range?.end, state.dateRange?.end);

					return (
						<ButtonTw
							key={label}
							type="button"
							size="xs"
							variant={isActive ? 'primary' : 'secondary'}
							onClick={() => {
								if (!range) return;

								state.setDateRange(range);
								if (moreThanOneModeEnabled) setMode('duration');
							}}
						>
							{finalLabel}
						</ButtonTw>
					);
				})}
			</ul>
		</div>
	);
}

const picker = forwardRef(DateRangePicker);

export { picker as DateRangePicker, useDatePickerContext };
