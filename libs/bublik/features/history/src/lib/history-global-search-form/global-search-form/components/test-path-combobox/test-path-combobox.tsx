/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { Control, FieldValues, Path, useController } from 'react-hook-form';

import { useMount } from '@/shared/hooks';
import { cn, cva, ErrorMessage, Icon, InputLabel } from '@/shared/tailwind-ui';
import { useGetTestSearchOptionsQuery } from '@/services/bublik-api';
import { useProjectSearch } from '@/bublik/features/projects';

function PathMiddleEllipsis({ value }: { value: string }) {
	const parts = value.split('/');

	if (parts.length <= 2) {
		return (
			<span className="min-w-0 flex-1 truncate text-xs" title={value}>
				{value}
			</span>
		);
	}

	const first = parts[0];
	const last = parts.at(-1);

	return (
		<span className="flex min-w-0 flex-1 items-center text-xs" title={value}>
			<span className="min-w-0 truncate">{first}</span>

			<span className="shrink-0 px-0.5">/…/</span>

			<span className="min-w-0 truncate">{last}</span>
		</span>
	);
}

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

export interface TestPathComboboxFieldProps<T extends FieldValues> {
	name: Path<T>;
	control: Control<T, unknown>;
	label?: string;
	placeholder?: string;
	disabled?: boolean;
	container?: React.RefObject<HTMLDivElement>;
	showEndOnMount?: boolean;
}

export function TestPathComboboxField<T extends FieldValues>(
	props: TestPathComboboxFieldProps<T>
) {
	const {
		name,
		control,
		label,
		placeholder,
		disabled,
		container,
		showEndOnMount = true
	} = props;

	const { field, fieldState } = useController({
		name,
		control,
		disabled
	});
	const inputRef = React.useRef<HTMLInputElement>(null);

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

	const id = React.useId();
	const hasError = Boolean(fieldState.error);
	const { projectIds } = useProjectSearch();

	const { data: testOptions = [] } = useGetTestSearchOptionsQuery(
		projectIds.length ? { project: projectIds?.[0] } : {}
	);
	const filter = Combobox.useFilter();

	const inputClass = cn(
		inputStyles(),
		hasError && errorClass(),
		'text-text-secondary',
		field.value ? 'pr-10' : 'pr-8'
	);

	return (
		<Combobox.Root
			items={testOptions}
			inputValue={field.value || ''}
			onInputValueChange={(value, eventDetails) => {
				if (eventDetails.reason === 'input-change') {
					field.onChange(value);
				}
			}}
			onValueChange={(value) => {
				if (typeof value === 'string') {
					field.onChange(value);
				}
			}}
			filter={filter.contains}
			itemToStringLabel={(item: string) => item}
			disabled={disabled}
		>
			<div className="relative">
				<div className="flex items-center gap-3">
					{label ? (
						<InputLabel
							className={cn(
								'absolute top-[-11px] left-2 z-10',
								disabled ? 'bg-bg-body text-border-primary' : 'bg-white'
							)}
							htmlFor={id}
						>
							{label}
						</InputLabel>
					) : null}
					<div className="relative w-full">
						<Combobox.Input
							id={id}
							placeholder={placeholder}
							className={inputClass}
							ref={inputRef}
						/>
						<div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
							<Combobox.Trigger
								className="rounded p-1 grid place-items-center text-text-menu hover:bg-primary-wash hover:text-primary"
								aria-label="Open popup"
							>
								<Icon
									name="ArrowShortTop"
									size={20}
									className="rotate-180 size-5"
								/>
							</Combobox.Trigger>
						</div>
					</div>
					{hasError ? (
						<Icon name="InputError" className="grid place-items-center" />
					) : null}
				</div>
				{hasError ? (
					<ErrorMessage>{fieldState.error?.message}</ErrorMessage>
				) : null}
			</div>

			<Combobox.Portal container={container}>
				<Combobox.Positioner sideOffset={4} className="outline-none z-50">
					<Combobox.Popup
						className={cn(
							'bg-white rounded border border-border-primary shadow-popover',
							'w-[var(--anchor-width)] max-w-[var(--available-width)]',
							'max-h-[min(var(--available-height),15rem)] overflow-hidden',
							'origin-[var(--transform-origin)]',
							'transition-[transform,opacity,scale] duration-100',
							'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
							'data-[ending-style]:scale-95 data-[ending-style]:opacity-0'
						)}
					>
						<Combobox.Empty>
							<div className="py-3 px-3.5 text-xs text-text-menu">
								No matches found
							</div>
						</Combobox.Empty>
						<Combobox.List
							className={cn(
								'overflow-y-auto overscroll-contain py-1',
								'max-h-[min(var(--available-height),15rem)]'
							)}
						>
							{(item: string) => (
								<Combobox.Item
									key={item}
									value={item}
									className={cn(
										'flex items-center gap-2 py-2 px-3.5 text-sm cursor-default',
										'select-none outline-none text-text-secondary',
										'data-[highlighted]:bg-primary-wash data-[highlighted]:text-primary'
									)}
								>
									<Combobox.ItemIndicator className="w-4 flex items-center justify-center shrink-0">
										<CheckIcon className="size-3" />
									</Combobox.ItemIndicator>

									<PathMiddleEllipsis value={item} />
								</Combobox.Item>
							)}
						</Combobox.List>
					</Combobox.Popup>
				</Combobox.Positioner>
			</Combobox.Portal>
		</Combobox.Root>
	);
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
	return (
		<svg
			fill="currentcolor"
			width="10"
			height="10"
			viewBox="0 0 10 10"
			{...props}
		>
			<path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
		</svg>
	);
}
