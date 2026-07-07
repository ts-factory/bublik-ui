/* SPDX-License-Identifier: Apache-2.0 */
import { useEffect, useState } from 'react';

import { useGetIssuePickerQuery } from '@/services/bublik-api';
import { cn } from '@/shared/tailwind-ui';

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

// Plain input + button list (no cmdk / nested Popover): cmdk's focus handling
// and a nested Popover both made the surrounding classify popover dismiss on
// select. type="button" also stops the list from submitting the classify form.
export function IssuePicker({ projectId, value, onChange }: IssuePickerProps) {
	const [query, setQuery] = useState('');
	const search = useDebouncedValue(query, 250);

	const { data, isFetching, isError } = useGetIssuePickerQuery({
		projectId,
		search: search || undefined
	});
	const options = data ?? [];

	return (
		<div className="flex flex-col overflow-hidden border rounded-md border-border-primary">
			<input
				type="text"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder="Search issue by key or title…"
				className="px-3 py-2 text-sm border-b outline-none border-border-primary placeholder:text-text-menu"
			/>
			<div className="overflow-y-auto max-h-48">
				{isFetching ? (
					<div className="py-3 text-xs text-center text-text-menu">
						Loading…
					</div>
				) : null}
				{isError ? (
					<div className="py-3 text-xs text-center text-text-menu">
						Couldn't load issues
					</div>
				) : null}
				{!isFetching && !isError && options.length === 0 ? (
					<div className="py-3 text-xs text-center text-text-menu">
						{search ? 'No matches' : 'No issues yet — create one'}
					</div>
				) : null}
				{options.map((o) => (
					<button
						type="button"
						key={o.id}
						onClick={() => onChange(o.id)}
						className={cn(
							'flex w-full items-center px-3 py-2 text-sm text-left hover:bg-primary-wash',
							value === o.id && 'bg-primary-wash font-semibold'
						)}
					>
						<span className="mr-1 font-medium">{issueTag(o)}:</span>
						<span className="truncate">{o.title}</span>
					</button>
				))}
			</div>
		</div>
	);
}
