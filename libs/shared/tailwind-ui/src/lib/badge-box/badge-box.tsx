/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { CheckIcon } from '@radix-ui/react-icons';

import { useMeasure } from '@/shared/hooks';
import { throttle } from '@/shared/utils';

import { cn } from '../utils';
import { Badge } from '../badge';
import { Command, CommandGroup, CommandItem, CommandList } from '../command';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { ButtonTw } from '../button';
import { Icon } from '../icon';

export type BoxValue = {
	label: string;
	value: string;
	isSelected?: boolean;
	className?: string;
};

export interface UserTagsComboboxParams<T extends BoxValue> {
	values: T[];
	onChange?: (boxes: T[]) => void;
}

const useTagsCombobox = <T extends BoxValue>(
	params: UserTagsComboboxParams<T>
) => {
	const { values, onChange } = params;
	const [inputValue, setInputValue] = useState<string>('');

	const create = (value: string) => {
		const newFramework = {
			value,
			label: value,
			isSelected: true
		} as T;

		const nextState = [...values, newFramework];
		setInputValue('');
		onChange?.(nextState);
	};

	const toggle = (passedBox: BoxValue) => {
		const current = values.find((b) => b.value === passedBox.value);

		if (!current) return;

		const nextState = !current.isSelected
			? check(passedBox)
			: uncheck(passedBox);

		onChange?.(nextState);
	};

	const check = (value: BoxValue) => {
		return values.map((box) => {
			if (box.value === value.value) box.isSelected = true;

			return box;
		});
	};

	const uncheck = (toRemove: BoxValue) => {
		return values.map((box) => {
			if (box.value === toRemove.value) {
				box.isSelected = false;
			}

			return box;
		});
	};

	const remove = (toRemove: BoxValue) => {
		onChange?.(uncheck(toRemove));
	};

	const handleBackspace = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === 'Backspace' && inputValue === '') {
				const filtered = values.filter((b) => b.isSelected);

				const lastValue = filtered.at(-1);

				if (!lastValue) return;

				setInputValue(lastValue.label);

				const nextState = values.map((box) => {
					if (box.value === lastValue.value) box.isSelected = false;

					return box;
				});

				onChange?.(nextState);
			}
		},
		[inputValue, onChange, values]
	);

	const selectedValues = useMemo(
		() => values.filter((box) => box.isSelected),
		[values]
	);

	useEffect(() => {
		document.addEventListener('keydown', handleBackspace);
		return () => document.removeEventListener('keydown', handleBackspace);
	}, [handleBackspace]);

	return {
		create,
		uncheck,
		toggle,
		setInputValue,
		remove,
		inputValue,
		selectedValues
	};
};

export interface FancyBoxProps {
	/** Label of the component */
	label: string;
	/** Default list of tags */
	values: BoxValue[];
	/** Handler on changed */
	onChange?: (boxes: BoxValue[]) => void;
	/** This is for labelling single item e.g. "Tag" */
	valueLabel?: string;
	/** Placeholder for input */
	placeholder?: string;
	/** Start icon for trigger button */
	startIcon?: ReactNode;
	/** End icon for trigger button */
	endIcon?: ReactNode;
}

/**
 * Tags box input is a button with combobox popover for inputting tags
 * Supports autocomplete and creating tags
 */
export const TagsBoxInput = (props: FancyBoxProps) => {
	const {
		label,
		endIcon,
		startIcon,
		placeholder,
		valueLabel,
		values,
		onChange
	} = props;

	const inputRef = useRef<HTMLInputElement>(null);
	const [openCombobox, setOpenCombobox] = useState(false);

	const handleChange = (boxes: BoxValue[]) => {
		onChange?.(boxes);
	};

	const { create, toggle, inputValue, setInputValue, selectedValues, remove } =
		useTagsCombobox({ values, onChange: handleChange });

	const handleComboboxOpenChange = (value: boolean) => {
		setTimeout(() => {
			if (value) inputRef.current?.focus();
		}, 0);
		setOpenCombobox(value);
	};

	const groupRef = useRef<HTMLDivElement>(null);
	const [isScrolled, setIsScrolled] = useState(false);
	const handleScroll = throttle(() => {
		if ((groupRef.current?.scrollTop || 0) > 0) {
			setIsScrolled(true);
		} else {
			setIsScrolled(false);
		}
	}, 200);

	const [tagsRef, { height: tagsHeight }] = useMeasure<HTMLDivElement>();

	return (
		<Popover open={openCombobox} onOpenChange={handleComboboxOpenChange} modal>
			<PopoverTrigger asChild>
				<ButtonTw
					variant="outline-secondary"
					size="md"
					state={openCombobox && 'active'}
					// eslint-disable-next-line jsx-a11y/role-has-required-aria-props
					role="combobox"
					aria-expanded={openCombobox}
				>
					{startIcon}
					<span className="truncate text-[0.875rem] font-medium leading-[1.5rem]">
						{selectedValues.length === 0 && label}
						{selectedValues.length >= 1 &&
							`${selectedValues.length} ${label} selected`}
					</span>
					{endIcon}
				</ButtonTw>
			</PopoverTrigger>
			<PopoverContent
				className="p-0 bg-white rounded-lg shadow-popover min-w-[380px] max-w-[380px] max-h-[var(--radix-popper-available-height)]"
				sideOffset={8}
			>
				<Command loop>
					<div
						className="relative flex flex-wrap w-full gap-1 px-2 py-3 overflow-hidden transition-shadow bg-primary-wash"
						onClick={() => inputRef.current?.focus()}
						ref={tagsRef}
					>
						{selectedValues.map(({ label, value, className }) => (
							<Badge key={value} className={cn('bg-badge-10', className)}>
								{label}
								<button onClick={() => remove({ label, value })} type="button">
									<Icon name="CrossSimple" size={16} className="ml-1" />
								</button>
							</Badge>
						))}
						<CommandPrimitive.Input
							className={cn(
								'text-sm border-none outline:none focus:ring-0 placeholder:text-text-menu disabled:cursor-not-allowed disabled:opacity-50 p-0 bg-transparent px-2 py-0.5 w-full'
							)}
							ref={inputRef}
							placeholder={placeholder}
							value={inputValue}
							onValueChange={setInputValue}
						/>
					</div>
					<CommandList>
						<CommandGroup
							className={cn(
								'overflow-auto p-0',
								'[&_[cmdk-group-heading]]:min-h-[38px] [&_[cmdk-group-heading]]:grid [&_[cmdk-group-heading]]:items-center [&_[cmdk-group-heading]]:border-b',
								'[&_[cmdk-group-heading]]:sticky [&_[cmdk-group-heading]]:top-0 [&_[cmdk-group-heading]]:bg-white [&_[cmdk-group-heading]]:z-10',
								isScrolled &&
									'[&_[cmdk-group-heading]]:shadow-[0_0_8px_0_rgb(0_0_0/10%)]'
							)}
							heading="Select an option or create one"
							style={{
								maxHeight: `calc(var(--radix-popover-content-available-height) - ${Math.round(
									tagsHeight + 24
								)}px)`
							}}
							onScroll={handleScroll}
							ref={groupRef}
						>
							{values.map((box) => {
								return (
									<CommandItem
										key={box.value}
										value={box.value}
										onSelect={() => toggle(box)}
										className="m-1"
									>
										<div
											className={cn(
												'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-text-menu',
												box.isSelected
													? 'bg-primary text-white border-primary'
													: 'opacity-50 [&_svg]:invisible'
											)}
										>
											<CheckIcon className={cn('h-4 w-4')} />
										</div>
										<Badge className={cn('bg-badge-10', box.className)}>
											{box.label}
										</Badge>
									</CommandItem>
								);
							})}
							<CommandItemCreate
								inputValue={inputValue}
								values={values}
								onSelect={() => create(inputValue)}
								valueLabel={valueLabel || label}
							/>
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};

const CommandItemCreate = ({
	inputValue,
	values,
	onSelect,
	valueLabel
}: {
	inputValue: string;
	values: BoxValue[];
	onSelect: () => void;
	valueLabel: string;
}) => {
	const hasNoFramework = !values
		.map(({ value }) => value)
		.includes(`${inputValue.toLowerCase()}`);

	const render = inputValue !== '' && hasNoFramework;

	if (!render) return null;

	// BUG: whenever a space is appended, the Create-Button will not be shown.
	return (
		<CommandItem
			key={`${inputValue}`}
			value={`${inputValue}`}
			className="text-xs text-muted-foreground m-1 min-h-[38px]"
			onSelect={onSelect}
		>
			<div className={cn('mr-2 h-4 w-4')} />
			Create new {valueLabel.toLowerCase()} &quot;{inputValue}&quot;
		</CommandItem>
	);
};
