/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ReactNode, RefObject, useEffect, useRef } from 'react';
import { CheckIcon } from '@radix-ui/react-icons';

import { PopoverContent } from '../popover';
import { cn } from '../utils';

interface MetaFilterSuggestionRow {
	/** The value, in the submit form. */
	entry: string;
	/** What a pick inserts (expression mode) or shows (value mode). */
	text: string;
	/** Position in the flat list, for the keyboard. */
	index: number;
	kind?: string;
	className?: string;
}

interface MetaFilterSuggestionGroupRows {
	label: string;
	rows: MetaFilterSuggestionRow[];
}

interface MetaFilterSuggestionListProps {
	id: string;
	label: string;
	mode: 'value' | 'expression';
	/** Value mode: whether Enter can add a value that is not listed. */
	allowCustomValues: boolean;
	/** What the rows are matched against, highlighted in each row. */
	query: string;
	groups: MetaFilterSuggestionGroupRows[];
	/** Value mode: the values already chosen, shown ticked. */
	checked: ReadonlySet<string>;
	highlightedIndex: number;
	loading: boolean;
	/** Expression mode: what the expression does not search, under the keys. */
	scopeNote?: string;
	/** The field: a press inside it is the field's to answer, not a dismissal. */
	fieldRef: RefObject<HTMLElement>;
	onHighlight: (index: number) => void;
	onPick: (row: MetaFilterSuggestionRow) => void;
}

function getSuggestionOptionId(listId: string, index: number): string {
	return `${listId}-option-${index}`;
}

function Kbd({ children }: { children: ReactNode }) {
	return (
		<kbd className="mr-1 inline-block min-w-[18px] rounded border border-b-2 border-border-input px-1 py-px text-center font-mono text-[10px] font-medium not-italic text-text-secondary">
			{children}
		</kbd>
	);
}

/** The row's text with the part matching the query underlined. */
function Highlighted({ text, query }: { text: string; query: string }) {
	const at = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;

	if (at < 0) return text;

	return (
		<>
			{text.slice(0, at)}
			<span className="font-bold underline decoration-primary underline-offset-[3px]">
				{text.slice(at, at + query.length)}
			</span>
			{text.slice(at + query.length)}
		</>
	);
}

/**
 * The values offered under the field. In value mode each row is a chip with
 * a tick, as the badge input lists them; in expression mode each row is the
 * code that a pick inserts at the caret, named by its kind, with no tick,
 * because an atom inside an expression is not a chip.
 */
function MetaFilterSuggestionList({
	id,
	label,
	mode,
	allowCustomValues,
	query,
	groups,
	checked,
	highlightedIndex,
	loading,
	scopeNote,
	fieldRef,
	onHighlight,
	onPick
}: MetaFilterSuggestionListProps) {
	const listRef = useRef<HTMLUListElement>(null);
	const isExpression = mode === 'expression';
	const rowCount = groups.reduce(
		(count, group) => count + group.rows.length,
		0
	);

	useEffect(() => {
		if (highlightedIndex < 0) return;

		listRef.current
			?.querySelector(`[data-index="${highlightedIndex}"]`)
			?.scrollIntoView?.({ block: 'nearest' });
	}, [highlightedIndex]);

	const isInsideField = (target: EventTarget | null) =>
		target instanceof Node && Boolean(fieldRef.current?.contains(target));

	const header = isExpression ? (
		<>
			Completing{' '}
			<code className="rounded bg-badge-0 px-1 py-px font-mono text-xs font-medium text-text-primary">
				{query || '…'}
			</code>{' '}
			at the caret
		</>
	) : query ? (
		`Matches for “${query}” in names and values`
	) : null;

	return (
		<PopoverContent
			className="z-[60] w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-lg bg-bg-elevated p-0 shadow-popover"
			align="start"
			sideOffset={6}
			onOpenAutoFocus={(event) => event.preventDefault()}
			onCloseAutoFocus={(event) => event.preventDefault()}
			onInteractOutside={(event) => {
				if (isInsideField(event.target)) event.preventDefault();
			}}
			data-testid="meta-filter-suggestions"
			// For a test to wait on: while the lists load, the rows are the metas
			// of the page only, and a typed name may not yet be known by kind.
			data-loading={loading ? 'true' : 'false'}
		>
			{header ? (
				<div className="border-b border-border-primary px-3 py-2 text-xs text-text-menu">
					{header}
				</div>
			) : null}
			<ul
				id={id}
				ref={listRef}
				role="listbox"
				aria-label={`${label} suggestions`}
				aria-multiselectable={!isExpression}
				className="max-h-72 overflow-y-auto p-1"
			>
				{groups.map((group) => (
					<li key={group.label} role="presentation" className="contents">
						<div className="px-2 pb-1 pt-2 text-xs font-medium text-text-menu">
							{group.label}
						</div>
						<ul role="group" aria-label={group.label} className="contents">
							{group.rows.map((row) => {
								const isHighlighted = row.index === highlightedIndex;
								const isChecked = !isExpression && checked.has(row.entry);

								return (
									<li
										key={row.entry}
										id={getSuggestionOptionId(id, row.index)}
										role="option"
										// The highlighted part is its own element, which a
										// name computed from the content would pad with spaces.
										aria-label={
											row.kind ? `${row.text}, ${row.kind}` : row.text
										}
										aria-selected={isExpression ? isHighlighted : isChecked}
										data-index={row.index}
										data-value={row.entry}
										data-highlighted={isHighlighted || undefined}
										// Keeps the focus in the field's input, so a pick does
										// not blur the field and close the list under the pointer.
										onMouseDown={(event) => event.preventDefault()}
										onMouseMove={() => {
											if (!isHighlighted) onHighlight(row.index);
										}}
										onClick={() => onPick(row)}
										className={cn(
											'flex cursor-default select-none items-center gap-3 rounded-md px-2 py-1.5 text-sm',
											isHighlighted && 'bg-primary-wash'
										)}
									>
										{isExpression ? null : (
											<span
												aria-hidden="true"
												className={cn(
													'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-text-menu text-white',
													isChecked ? 'border-primary bg-primary' : 'opacity-50'
												)}
											>
												{isChecked ? <CheckIcon className="h-4 w-4" /> : null}
											</span>
										)}
										{isExpression ? (
											<span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-pre font-mono text-xs text-text-primary">
												<Highlighted text={row.text} query={query} />
											</span>
										) : (
											<span
												className={cn(
													'inline-flex min-w-0 items-center rounded border border-transparent bg-badge-0 px-2 py-0.5 text-xs font-medium leading-[1.125rem] text-text-secondary [overflow-wrap:anywhere]',
													row.className
												)}
											>
												<Highlighted text={row.text} query={query} />
											</span>
										)}
										{isExpression && row.kind ? (
											<span className="ml-auto shrink-0 text-xs text-text-menu">
												{row.kind}
											</span>
										) : null}
									</li>
								);
							})}
						</ul>
					</li>
				))}
				{rowCount === 0 ? (
					<li
						role="presentation"
						className="py-4 text-center text-xs text-text-menu"
					>
						{loading
							? 'Loading suggestions…'
							: isExpression
							? `No name matches “${query}”. You can still type it.`
							: allowCustomValues
							? `No match. Enter adds “${query}” as a value.`
							: `No match for “${query}”.`}
					</li>
				) : null}
			</ul>
			<div className="flex flex-wrap gap-3 border-t border-border-primary px-3 py-2 text-xs text-text-menu">
				{isExpression ? (
					<>
						<span>
							<Kbd>Tab</Kbd>insert at caret
						</span>
						<span>
							<Kbd>↵</Kbd>add expression
						</span>
						<span>
							<Kbd>↑↓</Kbd>choose, <Kbd>↵</Kbd>insert it
						</span>
						<span>
							<Kbd>Esc</Kbd>close
						</span>
						{scopeNote ? <span className="basis-full">{scopeNote}</span> : null}
					</>
				) : (
					<>
						<span>
							<Kbd>↵</Kbd>add / remove chip
						</span>
						<span>
							<Kbd>↑↓</Kbd>move
						</span>
						<span>
							<Kbd>⌫</Kbd>remove last chip
						</span>
						<span>
							Type{' '}
							<code className="rounded bg-badge-0 px-1 font-mono text-text-primary">
								&amp; | ! ( )
							</code>{' '}
							for an expression
						</span>
					</>
				)}
			</div>
		</PopoverContent>
	);
}

export { MetaFilterSuggestionList, getSuggestionOptionId };
export type {
	MetaFilterSuggestionListProps,
	MetaFilterSuggestionRow,
	MetaFilterSuggestionGroupRows
};
