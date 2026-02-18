/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentPropsWithRef, forwardRef, useRef } from 'react';
import { mergeRefs } from '@react-aria/utils';

import { useMount } from '@/shared/hooks';

import { cva, cn } from '../utils';
import { ErrorMessage } from '../error-message';
import { InputLabel } from '../input-label';
import { Icon } from '../icon';

const inputStyles = cva({
	base: [
		'w-full',
		'px-3.5',
		'py-[7px]',
		'outline-none',
		'border',
		'border-border-primary',
		'rounded',
		'text-text-secondary',
		'transition-all',
		'hover:border-primary',
		'disabled:text-text-menu',
		'disabled:cursor-not-allowed',
		'focus:border-primary',
		'focus:shadow-text-field',
		'active:shadow-none',
		'focus:ring-transparent',
		'placeholder:text-text-menu placeholder:font-normal',
		'leading-[1.5rem] font-medium text-[0.875rem]'
	]
});

const errorClass = cva({
	base: [
		'border-bg-error',
		'hover:border-bg-error',
		'caret-bg-error',
		'shadow-text-field-error',
		'focus:border-bg-error',
		'active:shadow-none',
		'focus:shadow-text-field-error'
	]
});

const inputStyle = (props: Pick<InputProps, 'error'>) => {
	return cn(inputStyles(), props.error && errorClass());
};

export interface InputProps extends ComponentPropsWithRef<'input'> {
	label?: string;
	error?: string;
	showEndOnMount?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
	const { name, label, error, className, disabled, showEndOnMount, ...rest } =
		props;
	const inputRef = useRef<HTMLInputElement>(null);

	useMount(() => {
		if (!showEndOnMount || !inputRef.current) {
			return;
		}

		const inputElement = inputRef.current;

		try {
			const valueLength = inputElement.value.length;

			inputElement.setSelectionRange(valueLength, valueLength);
		} catch {
			// no-op for input types that do not support selection ranges
		}

		inputElement.scrollLeft = inputElement.scrollWidth;
	});

	return (
		<div className="relative">
			<div className="flex items-center gap-3">
				{label && (
					<InputLabel
						className={cn(
							'absolute top-[-11px] left-2',
							disabled ? 'bg-bg-body text-border-primary' : 'bg-white'
						)}
						htmlFor={name}
					>
						{label}
					</InputLabel>
				)}
				<input
					className={cn(inputStyle({ error }), className)}
					id={name}
					disabled={disabled}
					autoComplete="off"
					type="text"
					spellCheck="false"
					name={name}
					{...rest}
					ref={mergeRefs(inputRef, ref)}
					data-testid="input"
				/>
				{error && (
					<Icon name="InputError" className="grid place-items-center" />
				)}
			</div>
			{error && <ErrorMessage>{error}</ErrorMessage>}
		</div>
	);
});
