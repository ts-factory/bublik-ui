/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useId, useMemo, useState, type RefObject } from 'react';
import { Combobox } from '@base-ui/react/combobox';

import { useGetIssuePickerQuery } from '@/services/bublik-api';
import { cn, cva, ErrorMessage, Icon, InputLabel } from '@/shared/tailwind-ui';

import { comboboxInputStyles } from './issue-picker';
import { splitBugKey } from './bug-key';

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

/**
 * The trackers this project already uses, read off the keys the issue picker
 * has fetched anyway. There is no endpoint for the tracker list — it lives in
 * the `REFERENCES.ISSUES` global config, which the API does not expose — so the
 * issues themselves are the only source, and the field stays free text for the
 * project's first issue on a new tracker.
 *
 * The query args match `IssuePicker`'s idle call exactly, so this is the same
 * cache entry rather than a second request.
 */
export function useTrackerOptions(projectId?: number): string[] {
	const { data } = useGetIssuePickerQuery({ projectId, search: undefined });

	return useMemo(() => {
		const trackers = new Set<string>();

		data?.forEach((option) => {
			const split = option.key ? splitBugKey(option.key) : null;

			if (split) trackers.add(split.tracker);
		});

		return [...trackers].sort((a, b) => a.localeCompare(b));
	}, [data]);
}

export interface TrackerComboboxProps {
	value: string;
	onChange: (tracker: string) => void;
	options: string[];
	label?: string;
	placeholder?: string;
	error?: string;
	/** Portal target — see `IssuePickerProps.container` for why this matters. */
	container?: RefObject<HTMLElement>;
}

/**
 * Which issue tracker a bug key belongs to. Half of what used to be a single
 * field asking for `ref://TRACKER/KEY`: the scheme is how the key is stored,
 * not something anyone should have to type, so the drawer collects the tracker
 * and the key separately and `composeBugKey` joins them at submit time.
 *
 * Free text with suggestions rather than a select — the known trackers cover
 * the common case, but a project's first issue on a new one must still work.
 */
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
									: 'No trackers yet — type one, e.g. JIRA'}
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
