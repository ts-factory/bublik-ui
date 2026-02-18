/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef } from 'react';

import * as RadixCheckbox from '@radix-ui/react-checkbox';

import { cn, cva } from '../utils';
import { Icon, IconProps } from '../icon';

const isBoxedCheckbox = (
	props: SimpleCheckboxProps | BoxedCheckboxProps
): props is BoxedCheckboxProps => {
	return 'iconName' in props && 'iconSize' in props && 'label' in props;
};

export type CheckboxProps = SimpleCheckboxProps | BoxedCheckboxProps;

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
	(props, ref) => {
		if (isBoxedCheckbox(props)) {
			return <BoxedCheckbox {...props} ref={ref} />;
		}

		return <SimpleCheckbox {...props} ref={ref} />;
	}
);

type SimpleCheckboxProps = RadixCheckbox.CheckboxProps & { label?: string };

const SimpleCheckbox = forwardRef<HTMLButtonElement, SimpleCheckboxProps>(
	(props, ref) => {
		const checked = props.checked;

		const controlId = props.id ?? props.name;

		return (
			<div className="flex items-center">
				<RadixCheckbox.Root
					className={cn(
						'peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-sm transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
						checked
							? 'text-white bg-primary border-primary'
							: 'border-border-primary'
					)}
					data-testid="tw-checkbox"
					data-slot="checkbox"
					name={props.name}
					{...props}
					ref={ref}
				>
					<RadixCheckbox.Indicator className="grid place-content-center text-current transition-none">
						{checked === 'indeterminate' && (
							<div className="h-2 w-2 rounded-sm bg-current" />
						)}
						{checked === true && (
							<svg
								width="14"
								height="14"
								viewBox="0 0 15 15"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z"
									fill="currentColor"
									fillRule="evenodd"
									clipRule="evenodd"
								/>
							</svg>
						)}
					</RadixCheckbox.Indicator>
				</RadixCheckbox.Root>
				<label htmlFor={controlId} className="pl-2">
					{props.label}
				</label>
			</div>
		);
	}
);

const checkboxLabelStyles = cva({
	base: [
		'flex',
		'items-center',
		'justify-start',
		'w-full',
		'h-full',
		'cursor-pointer',
		'gap-1',
		'border',
		'border-border-primary',
		'px-2',
		'py-1.5',
		'rounded',
		'transition-all',
		'focus-within:shadow-[0_0_0_2px_rgba(98,126,251,0.1)]',
		'rdx-state-checked:border-primary'
	]
});

const iconStyles = cva({
	base: [
		'grid place-items-center',
		'rdx-state-checked:text-primary rdx-state-unchecked:text-border-primary'
	]
});

type BoxedCheckboxProps = RadixCheckbox.CheckboxProps & {
	label: string;
	iconName: IconProps['name'];
	iconSize: IconProps['size'];
	iconClassName?: string;
};

const BoxedCheckbox = forwardRef<HTMLButtonElement, BoxedCheckboxProps>(
	(props, ref) => {
		const { iconName, iconSize, label, iconClassName, ...restProps } = props;

		return (
			<RadixCheckbox.Root
				checked={props.checked}
				onCheckedChange={props.onCheckedChange}
				className={checkboxLabelStyles()}
				{...restProps}
				data-testid="tw-checkbox"
				ref={ref}
			>
				<RadixCheckbox.CheckboxIndicator
					forceMount
					className={cn(iconStyles(), iconClassName)}
				>
					<Icon name={iconName} size={iconSize} />
				</RadixCheckbox.CheckboxIndicator>
				<span className="pointer-events-none text-[0.75rem] font-medium leading-[0.875rem]">
					{label}
				</span>
			</RadixCheckbox.Root>
		);
	}
);
