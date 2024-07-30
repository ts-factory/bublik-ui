/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentPropsWithRef, forwardRef, SVGProps } from 'react';

import { cn } from '../utils';

const CheckedIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
	(props, ref) => {
		return (
			<svg
				width="12"
				height="12"
				viewBox="0 0 12 12"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				{...props}
				ref={ref}
			>
				<rect width="12" height="12" fill="white" />
				<circle
					cx="6"
					cy="6"
					r="5.5"
					fill="currentColor"
					stroke="currentColor"
				/>
				<circle cx="6" cy="6" r="3" fill="white" />
			</svg>
		);
	}
);

const UncheckedIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
	(props, ref) => {
		return (
			<svg
				width="12"
				height="12"
				viewBox="0 0 12 12"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				{...props}
				ref={ref}
			>
				<rect width="12" height="12" fill="white" />
				<circle cx="6" cy="6" r="5.5" stroke="currentColor" />
			</svg>
		);
	}
);

export interface RadioProps extends ComponentPropsWithRef<'input'> {
	label: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>((props, ref) => {
	const { label, ...rest } = props;

	return (
		<div data-testid="radio-field" ref={ref}>
			<label
				className={cn(
					'flex items-center w-full h-full gap-2 leading-[0.75rem] transition-all cursor-pointer text-[0.75rem] font-medium px-3 py-2 border border-border-primary rounded focus-within:shadow-[0_0_0_2px_rgba(98,126,251,0.1)]',
					props.checked && 'border-primary'
				)}
				aria-checked={props.checked}
				data-testid="tw-radio"
			>
				{props.checked ? (
					<CheckedIcon className="text-primary" />
				) : (
					<UncheckedIcon className="text-text-menu" />
				)}
				<input
					className="absolute w-0 h-0 opacity-0 appearance-none"
					type="radio"
					{...rest}
				/>
				<span className="text-[0.75rem] leading-[0.875rem]">{label}</span>
			</label>
		</div>
	);
});
