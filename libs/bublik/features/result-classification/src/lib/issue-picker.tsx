/* SPDX-License-Identifier: Apache-2.0 */
import { useEffect, useState } from 'react';

import { useGetIssuePickerQuery } from '@/services/bublik-api';
import {
	ButtonTw,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Icon,
	Popover,
	PopoverContent,
	PopoverTrigger
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

export function IssuePicker({ projectId, value, onChange }: IssuePickerProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	const search = useDebouncedValue(query, 250);

	const { data, isFetching, isError } = useGetIssuePickerQuery({
		projectId,
		search: search || undefined
	});
	const options = data ?? [];
	const selected = options.find((o) => o.id === value);

	return (
		<Popover open={open} onOpenChange={setOpen} modal>
			<PopoverTrigger asChild>
				<ButtonTw
					type="button"
					variant="secondary"
					size="xss"
					className="justify-between w-full"
				>
					<span className="truncate">
						{selected
							? `${issueTag(selected)}: ${selected.title}`
							: value
								? `#${value}`
								: 'Search issue…'}
					</span>
					<Icon name="ArrowShortSmall" size={16} className="ml-1 -rotate-90" />
				</ButtonTw>
			</PopoverTrigger>
			<PopoverContent sideOffset={6} className="p-0 w-[320px]">
				<Command shouldFilter={false}>
					<CommandInput
						value={query}
						onValueChange={setQuery}
						placeholder="Search by key or title…"
					/>
					<CommandList>
						{isFetching ? (
							<div className="py-4 text-xs text-center text-text-menu">Loading…</div>
						) : null}
						{isError ? (
							<div className="py-4 text-xs text-center text-text-menu">
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
									onSelect={() => {
										onChange(o.id);
										setOpen(false);
									}}
								>
									<span className="mr-1 font-medium">{issueTag(o)}:</span>
									<span className="truncate">{o.title}</span>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
