/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { createPortal } from 'react-dom';
import { Control, FieldValues, Path, useController } from 'react-hook-form';

import { useMount } from '@/shared/hooks';
import { cn, cva, ErrorMessage, Icon, InputLabel } from '@/shared/tailwind-ui';
import { useGetTestSearchOptionsQuery } from '@/services/bublik-api';
import { useProjectSearch } from '@/bublik/features/projects';

import {
	getCommonPrefix,
	getPathSuggestionLabel,
	getPathSuggestions,
	shouldUseCompactLeafLabel
} from './test-path-combobox.utils';

function PathSuggestionText(props: { input: string; value: string }) {
	const { input, value } = props;
	const label = getPathSuggestionLabel(value, input);

	return (
		<span className="min-w-0 flex-1 truncate text-xs" title={value}>
			{label}
		</span>
	);
}

function PathSuggestionIcon({ value }: { value: string }) {
	if (value.endsWith('/')) {
		return <Icon name="Folder" className="flex-shrink-0" />;
	}

	return <Icon name="Paper" size={16} className="flex-shrink-0" />;
}

type HighlightOverlayPosition = {
	top: number;
	left: number;
	minWidth: number;
	maxWidth: number;
	height: number;
};

function FullPathOverlayTooltip(props: {
	value: string | undefined;
	position: HighlightOverlayPosition | null;
}) {
	const { value, position } = props;

	if (!value || !position) {
		return null;
	}

	return createPortal(
		<div
			className={cn(
				'fixed z-[1000] pointer-events-none outline-none',
				'flex items-center gap-2 py-2 px-3.5 text-sm cursor-default',
				'select-none text-primary bg-primary-wash'
			)}
			style={{
				top: position.top,
				left: position.left,
				minWidth: position.minWidth,
				maxWidth: position.maxWidth,
				width: 'max-content',
				height: position.height
			}}
		>
			<PathSuggestionIcon value={value} />
			<span
				className="min-w-0 flex-1 overflow-hidden translate-y-px text-ellipsis whitespace-nowrap text-xs"
				title={value}
			>
				{value}
			</span>
		</div>,
		document.body
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
	const [open, setOpen] = React.useState(false);
	const keepOpenOnNextCloseRef = React.useRef(false);
	const highlightedSuggestionRef = React.useRef<string | undefined>();
	const suggestionElementsRef = React.useRef(new Map<string, HTMLElement>());
	const suggestionLabelElementsRef = React.useRef(
		new Map<string, HTMLSpanElement>()
	);
	const [highlightedSuggestion, setHighlightedSuggestion] = React.useState<
		string | undefined
	>();
	const [highlightOverlayPosition, setHighlightOverlayPosition] =
		React.useState<HighlightOverlayPosition | null>(null);

	const { data: testOptions = [] } = useGetTestSearchOptionsQuery(
		projectIds.length ? { project: projectIds?.[0] } : {}
	);
	const fieldValue = typeof field.value === 'string' ? field.value : '';
	const suggestions = React.useMemo(
		() => getPathSuggestions(testOptions, fieldValue),
		[testOptions, fieldValue]
	);

	const inputClass = cn(
		inputStyles(),
		hasError && errorClass(),
		'text-text-secondary',
		field.value ? 'pr-10' : 'pr-8'
	);

	const completeFromTab = React.useCallback(
		(event: KeyboardEvent | React.KeyboardEvent<HTMLInputElement>) => {
			if (
				event.key !== 'Tab' ||
				event.shiftKey ||
				event.ctrlKey ||
				event.altKey ||
				event.metaKey
			) {
				return false;
			}

			const inputElement = inputRef.current;

			if (!inputElement) {
				return false;
			}

			const inputValue = inputElement.value;
			const currentSuggestions = getPathSuggestions(testOptions, inputValue);
			const commonPrefix = getCommonPrefix(currentSuggestions);
			const highlightedSuggestion = highlightedSuggestionRef.current;
			const completion =
				highlightedSuggestion?.startsWith(inputValue) &&
				highlightedSuggestion.length > inputValue.length
					? highlightedSuggestion
					: commonPrefix.length > inputValue.length &&
					  commonPrefix.startsWith(inputValue)
					? commonPrefix
					: undefined;

			if (!completion) {
				return false;
			}

			event.preventDefault();
			event.stopPropagation();
			field.onChange(completion);
			setOpen(true);

			window.requestAnimationFrame(() => {
				const currentInputElement = inputRef.current;

				if (!currentInputElement) {
					return;
				}

				currentInputElement.setSelectionRange(
					completion.length,
					completion.length
				);
				currentInputElement.scrollLeft = currentInputElement.scrollWidth;
			});

			return true;
		},
		[field, testOptions]
	);

	React.useEffect(() => {
		const handleDocumentKeyDown = (event: KeyboardEvent) => {
			if (
				document.activeElement === inputRef.current &&
				completeFromTab(event)
			) {
				event.stopImmediatePropagation();
			}
		};

		document.addEventListener('keydown', handleDocumentKeyDown, {
			capture: true
		});

		return () => {
			document.removeEventListener('keydown', handleDocumentKeyDown, {
				capture: true
			});
		};
	}, [completeFromTab]);

	const handleSuggestionSelect = (value: string) => {
		field.onChange(value);

		if (!value.endsWith('/')) {
			keepOpenOnNextCloseRef.current = false;
			setOpen(false);
			return;
		}

		keepOpenOnNextCloseRef.current = true;
		setOpen(true);

		window.requestAnimationFrame(() => {
			const inputElement = inputRef.current;

			if (!inputElement) {
				return;
			}

			inputElement.focus();
			inputElement.setSelectionRange(value.length, value.length);
			inputElement.scrollLeft = inputElement.scrollWidth;
		});
	};

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen && keepOpenOnNextCloseRef.current) {
			keepOpenOnNextCloseRef.current = false;
			setOpen(true);
			return;
		}

		setOpen(nextOpen);
	};

	const updateHighlightOverlayPosition = React.useCallback(
		(item?: string) => {
			const highlightedItem = item ?? highlightedSuggestionRef.current;
			const highlightedElement = highlightedItem
				? suggestionElementsRef.current.get(highlightedItem)
				: null;

			if (!highlightedElement) {
				setHighlightOverlayPosition(null);
				return;
			}

			if (!highlightedItem) {
				setHighlightOverlayPosition(null);
				return;
			}

			const highlightedLabelElement =
				suggestionLabelElementsRef.current.get(highlightedItem);

			if (
				!highlightedLabelElement ||
				(highlightedLabelElement.scrollWidth <=
					highlightedLabelElement.clientWidth + 1 &&
					!shouldUseCompactLeafLabel(highlightedItem, fieldValue))
			) {
				setHighlightOverlayPosition(null);
				return;
			}

			const rect = highlightedElement.getBoundingClientRect();
			const availableWidth = window.innerWidth - rect.left - 8;

			setHighlightOverlayPosition({
				top: rect.top,
				left: rect.left,
				minWidth: rect.width,
				maxWidth: Math.max(rect.width, availableWidth),
				height: rect.height
			});
		},
		[fieldValue]
	);

	React.useEffect(() => {
		if (!open || !highlightedSuggestion) {
			setHighlightOverlayPosition(null);
			return undefined;
		}

		updateHighlightOverlayPosition();

		const handleViewportChange = () => {
			updateHighlightOverlayPosition();
		};

		window.addEventListener('resize', handleViewportChange);
		window.addEventListener('scroll', handleViewportChange, true);

		return () => {
			window.removeEventListener('resize', handleViewportChange);
			window.removeEventListener('scroll', handleViewportChange, true);
		};
	}, [highlightedSuggestion, open, updateHighlightOverlayPosition]);

	return (
		<Combobox.Root
			items={suggestions}
			inputValue={fieldValue}
			open={open}
			onOpenChange={handleOpenChange}
			onInputValueChange={(value, eventDetails) => {
				if (eventDetails.reason === 'input-change') {
					field.onChange(value);
					setOpen(true);
				}
			}}
			onValueChange={(value) => {
				if (typeof value === 'string') {
					handleSuggestionSelect(value);
				}
			}}
			filter={null}
			itemToStringLabel={(item: string) => item}
			onItemHighlighted={(item) => {
				highlightedSuggestionRef.current = item;
				setHighlightedSuggestion(item);

				window.requestAnimationFrame(() => {
					updateHighlightOverlayPosition(item);
				});
			}}
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
							onKeyDownCapture={completeFromTab}
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
								'overflow-y-auto overflow-x-hidden overscroll-contain py-1',
								'max-h-[min(var(--available-height),15rem)]'
							)}
						>
							{(item: string) => (
								<Combobox.Item
									key={item}
									value={item}
									ref={(element) => {
										if (element) {
											suggestionElementsRef.current.set(item, element);
											return;
										}

										suggestionElementsRef.current.delete(item);
									}}
									onPointerEnter={() => {
										highlightedSuggestionRef.current = item;
										setHighlightedSuggestion(item);
										updateHighlightOverlayPosition(item);
									}}
									className={cn(
										'flex min-w-0 w-full overflow-hidden items-center gap-2 py-2 px-3.5 text-sm cursor-default',
										'select-none outline-none text-text-secondary',
										'data-[highlighted]:bg-primary-wash data-[highlighted]:text-primary'
									)}
								>
									<PathSuggestionIcon value={item} />
									<span
										ref={(element) => {
											if (element) {
												suggestionLabelElementsRef.current.set(item, element);
												return;
											}

											suggestionLabelElementsRef.current.delete(item);
										}}
										className="min-w-0 flex-1 truncate"
									>
										<PathSuggestionText input={fieldValue} value={item} />
									</span>
								</Combobox.Item>
							)}
						</Combobox.List>
					</Combobox.Popup>
					<FullPathOverlayTooltip
						value={highlightedSuggestion}
						position={highlightOverlayPosition}
					/>
				</Combobox.Positioner>
			</Combobox.Portal>
		</Combobox.Root>
	);
}
