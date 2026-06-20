/* SPDX-License-Identifier: Apache-2.0 */
import { useEffect, useState } from 'react';

import { useGetIssuePickerQuery } from '@/services/bublik-api';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	cn
} from '@/shared/tailwind-ui';

import { issueTag } from './issue-picker.utils';

function useDebouncedValue<T>(value: T, delayMs: number): T {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const id = setTimeout(() => setDebounced(value), delayMs);
		return () => clearTimeout(id);
	}, [value, delayMs]);
	return debounced;
}

export interface IssuePickerProps {
	projectId?: number;
	value?: number;
	onChange: (id: number) => void;
}

// Rendered inline (not in a nested Popover) so selecting an option doesn't get
// treated as an outside-click by the surrounding classify popover.
export function IssuePicker({ projectId, value, onChange }: IssuePickerProps) {
	const [query, setQuery] = useState('');
	const search = useDebouncedValue(query, 250);

	const { data, isFetching, isError } = useGetIssuePickerQuery({
		projectId,
		search: search || undefined
	});
	const options = data ?? [];

	return (
		<Command
			shouldFilter={false}
			className="border border-border-primary rounded-md"
		>
			<CommandInput
				value={query}
				onValueChange={setQuery}
				placeholder="Search by key or title…"
			/>
			<CommandList className="max-h-48">
				{isFetching ? (
					<div className="py-3 text-xs text-center text-text-menu">Loading…</div>
				) : null}
				{isError ? (
					<div className="py-3 text-xs text-center text-text-menu">
						Couldn't load issues
					</div>
				) : null}
				{!isFetching && !isError && options.length === 0 ? (
					<CommandEmpty>
						{search ? 'No matches' : 'No issues yet — create one'}
					</CommandEmpty>
				) : null}
				<CommandGroup>
					{options.map((o) => (
						<CommandItem
							key={o.id}
							value={String(o.id)}
							onSelect={() => onChange(o.id)}
							className={cn(
								'cursor-pointer',
								value === o.id && 'bg-primary-wash font-semibold'
							)}
						>
							<span className="mr-1 font-medium">{issueTag(o)}:</span>
							<span className="truncate">{o.title}</span>
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</Command>
	);
}
