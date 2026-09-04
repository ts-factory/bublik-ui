/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useId, useMemo, useState, type RefObject } from 'react';
import { Combobox } from '@base-ui/react/combobox';

import {
	useGetIssuePickerQuery,
	useGetIssueTrackersQuery
} from '@/services/bublik-api';
import { cn, cva, ErrorMessage, Icon, InputLabel } from '@/shared/tailwind-ui';

import { comboboxInputStyles } from './pickers.styles';
import { mergeTrackerOptions } from '../shared/tracker-options.utils';

const errorStyles = cva({
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

export interface TrackerOptions {
	/** Configured trackers in config order, then any used but unconfigured one. */
	options: string[];
	/** First configured tracker, or `''` when the project configures none. */
	defaultTracker: string;
	isLoading: boolean;
}

/**
 * The project's issue trackers, as configured under `REFERENCES.ISSUES`.
 *
 * Configuration comes first and decides the default. Trackers that only appear
 * on existing issues are appended rather than dropped, so editing an issue
 * whose bug key predates the config — or was written against another project —
 * still offers the tracker it actually uses.
 */
export function useTrackerOptions(projectId?: number): TrackerOptions {
	const { data: trackers, isLoading } = useGetIssueTrackersQuery({ projectId });
	const { data: issues } = useGetIssuePickerQuery({
		projectId,
		search: undefined
	});

	const configured = useMemo(
		() => Object.keys(trackers?.issues ?? {}),
		[trackers]
	);

	const options = useMemo(
		() =>
			mergeTrackerOptions(
				configured,
				(issues ?? []).map((i) => i.key)
			),
		[configured, issues]
	);

	return { options, defaultTracker: configured[0] ?? '', isLoading };
}

export interface TrackerComboboxProps {
	value: string;
	onChange: (tracker: string) => void;
	options: string[];
	label?: string;
	placeholder?: string;
	error?: string;
	container?: RefObject<HTMLElement>;
}

export function TrackerCombobox({
	value,
	onChange,
	options,
	label = 'Tracker',
	placeholder = 'JIRA',
	error,
	container
}: TrackerComboboxProps) {
	const id = useId();
	const [open, setOpen] = useState(false);

	return (
		<Combobox.Root
			items={options}
			inputValue={value}
			open={open}
			onOpenChange={setOpen}
			onInputValueChange={(next, eventDetails) => {
				if (eventDetails.reason !== 'input-change') return;

				onChange(next);
				setOpen(true);
			}}
			onValueChange={(next) => onChange((next as string | null) ?? '')}
		>
			<div className="relative">
				{label ? (
					<InputLabel
						className="absolute top-[-11px] left-2 z-10 bg-white"
						htmlFor={id}
					>
						{label}
					</InputLabel>
				) : null}
				<div className="relative w-full">
					<Combobox.Input
						id={id}
						placeholder={placeholder}
						className={cn(
							comboboxInputStyles(),
							'pr-10',
							error && errorStyles()
						)}
						data-testid="classify-tracker-input"
					/>
					<Combobox.Trigger
						className="absolute grid p-1 -translate-y-1/2 rounded right-2 top-1/2 place-items-center text-text-menu hover:bg-primary-wash hover:text-primary"
						aria-label="Open tracker list"
					>
						<Icon name="ArrowShortTop" size={20} className="rotate-180" />
					</Combobox.Trigger>
				</div>
			</div>

			{error ? <ErrorMessage>{error}</ErrorMessage> : null}

			<Combobox.Portal container={container}>
				<Combobox.Positioner sideOffset={4} className="z-[60] outline-none">
					<Combobox.Popup
						className={cn(
							'bg-white rounded shadow-popover',
							'w-[var(--anchor-width)] max-w-[var(--available-width)]',
							'max-h-[min(var(--available-height),15rem)] overflow-hidden'
						)}
						data-testid="classify-tracker-popup"
					>
						<Combobox.Empty>
							<div className="py-3 px-3.5 text-xs text-text-menu">
								{options.length
									? 'No matches — type a tracker name'
									: 'No trackers configured for this project — add them under ISSUES in its references config, or type one'}
							</div>
						</Combobox.Empty>
						<Combobox.List className="overflow-y-auto overflow-x-hidden overscroll-contain py-1 max-h-[min(var(--available-height),15rem)]">
							{(item: string) => (
								<Combobox.Item
									key={item}
									value={item}
									className={cn(
										'flex min-w-0 w-full overflow-hidden items-center py-2 px-3.5 text-xs cursor-default',
										'select-none outline-none text-text-secondary',
										'data-[highlighted]:bg-primary-wash data-[highlighted]:text-primary'
									)}
									data-testid="classify-tracker-option"
								>
									{item}
								</Combobox.Item>
							)}
						</Combobox.List>
					</Combobox.Popup>
				</Combobox.Positioner>
			</Combobox.Portal>
		</Combobox.Root>
	);
}
