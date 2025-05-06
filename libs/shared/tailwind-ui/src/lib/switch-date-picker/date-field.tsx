/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
	DateFieldState,
	useDateFieldState,
	DateSegment as DateSegmentType
} from '@react-stately/datepicker';
import {
	AriaDatePickerProps,
	useDateField,
	useDateSegment
} from '@react-aria/datepicker';
import { createCalendar, DateValue } from '@internationalized/date';

import { LOCALE } from './utils';
import { cn } from '../utils';

const getSegmentsInOrder = (segments: DateSegmentType[]): DateSegmentType[] => {
	const yearSegment = segments.find((segment) => segment.type === 'year');
	const monthSegment = segments.find((segment) => segment.type === 'month');
	const daySegment = segments.find((segment) => segment.type === 'day');
	const literalSegment = segments.find((segment) => segment.type === 'literal');

	if (!yearSegment || !monthSegment || !daySegment || !literalSegment) {
		throw new Error('Invalid date format');
	}

	const resultSegments = [
		yearSegment,
		literalSegment,
		monthSegment,
		literalSegment,
		daySegment
	];

	return resultSegments;
};

export interface DateFieldProps extends AriaDatePickerProps<DateValue> {
	underline?: boolean;
}

export const DateField: FC<DateFieldProps> = ({ underline, ...props }) => {
	const ref = useRef(null);
	const state = useDateFieldState({
		...props,
		locale: LOCALE,
		createCalendar
	});

	const { fieldProps } = useDateField(props, state, ref);
	const [isFocused, setIsFocused] = useState(false);

	return (
		<div
			{...fieldProps}
			ref={ref}
			className="relative flex items-center h-full"
			onFocus={() => setIsFocused(true)}
			onBlur={() => setIsFocused(false)}
		>
			{getSegmentsInOrder(state.segments).map((segment, i) => (
				<DateSegment key={i} segment={segment} state={state} />
			))}
			{isFocused && underline ? (
				<motion.div
					className="absolute bottom-0 w-full h-0.5 bg-primary"
					layoutId="underline"
				/>
			) : null}
		</div>
	);
};

export interface DateSegmentProps {
	segment: DateSegmentType;
	state: DateFieldState;
}

const DateSegment: FC<DateSegmentProps> = ({ segment, state }) => {
	const ref = useRef(null);
	const { segmentProps } = useDateSegment(segment, state, ref);

	return (
		<div
			{...segmentProps}
			ref={ref}
			style={{
				...segmentProps.style,
				minWidth:
					segment.maxValue != null
						? String(segment.maxValue).length + 'ch'
						: undefined,
				textAlign: 'center'
			}}
			className={cn(
				'box-content tabular-nums text-right outline-none rounded-sm focus:bg-primary focus:text-white group',
				!segment.isEditable ? 'text-text-menu' : 'text-text-primary',
				state.isDisabled
					? 'text-text-menu cursor-not-allowed'
					: 'text-text-primary'
			)}
		>
			{/* Always reserve space for the placeholder, to prevent layout shift when editing. */}
			<span
				aria-hidden="true"
				className="block w-full text-[0.875rem] font-medium leading-[1.5rem] group-focus:text-white"
				style={{
					visibility: segment.isPlaceholder ? undefined : 'hidden',
					height: segment.isPlaceholder ? '' : 0,
					pointerEvents: 'none'
				}}
			>
				{segment.placeholder}
			</span>
			{segment.isPlaceholder ? (
				''
			) : (
				<span className="text-[0.875rem] font-medium leading-[1.5rem] group-focus:text-white">
					{segment.type === 'literal' ? '.' : segment.text.padStart(2, '0')}
				</span>
			)}
		</div>
	);
};
