/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { flexRender, type Row, type Table } from '@tanstack/react-table';

import { useDebounce } from '@/shared/hooks';
import { Icon, Input, TableSort, cn } from '@/shared/tailwind-ui';

/**
 * The run table's markup, factored out so every classification table looks the
 * same: ruled rows, a ruled header, and cells that share one border grid
 * rather than floating as separate rounded pills.
 *
 * Mirrors `run-table/components/{header,row}` — keep the class strings in step
 * with those if they change.
 */

export interface ClassificationTableProps<T> {
	table: Table<T>;
	/**
	 * Pins the header row while the body scrolls. Off by default because the
	 * same component renders expanded sub-tables, which scroll with their parent
	 * and would otherwise pin a second header mid-page.
	 */
	stickyHeader?: boolean;
	/** Rendered in a full-width row under an expanded row. */
	renderSubRow?: (row: Row<T>) => ReactNode;
	/** Extra attributes per row, typically `data-*` hooks for e2e. */
	getRowAttributes?: (row: Row<T>) => Record<string, string | number>;
	testId?: string;
}

export function ClassificationTable<T>({
	table,
	stickyHeader = false,
	renderSubRow,
	getRowAttributes,
	testId
}: ClassificationTableProps<T>) {
	return (
		<table
			// Width fills, height does not: inside a `flex-1` scroll pane a
			// `h-full` table stretches to the pane and the leftover height is
			// dumped into the first row, which then towers over the rest.
			className="w-full p-0 m-0 border-separate border-spacing-0"
			data-testid={testId}
		>
			<thead className="text-left text-[0.6875rem] font-semibold leading-[0.875rem]">
				{table.getHeaderGroups().map((headerGroup) => (
					<tr key={headerGroup.id} className="h-8.5">
						{headerGroup.headers.map((header, idx, arr) => {
							const canSort = header.column.getCanSort();

							return (
								<th
									key={header.id}
									colSpan={header.colSpan}
									className={cn(
										'px-2 bg-primary-wash border-b border-border-primary',
										// The border lives on the `th`, not the `tr`, so it travels
										// with the sticky cell — under `border-separate` a row-level
										// border would be left behind by the scrolling body.
										stickyHeader && 'sticky top-0 z-10',
										idx !== arr.length - 1 && 'border-r',
										header.column.columnDef.meta?.className
									)}
								>
									{header.isPlaceholder ? null : canSort ? (
										<div
											onClick={header.column.getToggleSortingHandler()}
											className={cn(
												'flex items-center gap-1 px-1 py-1 transition-colors rounded cursor-pointer select-none hover:bg-white/60',
												header.column.getIsSorted() && 'bg-white/60'
											)}
										>
											{flexRender(
												header.column.columnDef.header,
												header.getContext()
											)}
											<TableSort
												sortDescription={header.column.getIsSorted()}
											/>
										</div>
									) : (
										flexRender(
											header.column.columnDef.header,
											header.getContext()
										)
									)}
								</th>
							);
						})}
					</tr>
				))}
			</thead>
			<tbody className="text-[0.75rem] leading-[1.125rem] font-medium [&>*:not(:last-child)>*]:border-b [&>*:not(:last-child)>*]:border-border-primary">
				{table.getRowModel().rows.map((row) => (
					<Fragment key={row.id}>
						<tr
							className="relative h-full [&>*]:hover:bg-gray-50"
							{...getRowAttributes?.(row)}
						>
							{row.getVisibleCells().map((cell, idx, arr) => (
								<td
									key={cell.id}
									className={cn(
										'px-2 py-1 align-top bg-white',
										idx !== arr.length - 1 && 'border-r border-border-primary',
										cell.column.columnDef.meta?.className
									)}
								>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</td>
							))}
						</tr>
						{renderSubRow && row.getIsExpanded() ? (
							<tr>
								<td
									colSpan={row.getVisibleCells().length}
									className="p-0 border-b bg-primary-wash/40 border-border-primary"
								>
									{renderSubRow(row)}
								</td>
							</tr>
						) : null}
					</Fragment>
				))}
			</tbody>
		</table>
	);
}

export interface ClassificationToolbarProps {
	children: ReactNode;
}

/** The run table's toolbar bar, minus the column controls. */
export function ClassificationToolbar({
	children
}: ClassificationToolbarProps) {
	return (
		<div className="flex flex-wrap items-center gap-2 px-4 py-1 bg-white border-b border-border-primary shrink-0">
			{children}
		</div>
	);
}

export interface ClassificationFooterProps {
	children: ReactNode;
}

/**
 * The toolbar's mirror, pinned under the scrolling body.
 *
 * It always renders, because the shared `Pagination` hides itself below two
 * pages and an empty bar would look broken — the row count keeps it occupied.
 */
export function ClassificationFooter({ children }: ClassificationFooterProps) {
	return (
		<div className="flex items-center gap-2 px-4 py-2 bg-white border-t border-border-primary shrink-0">
			{children}
		</div>
	);
}

export interface ClassificationSearchProps {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	testId: string;
	className?: string;
}

/**
 * The toolbar's free-text box.
 *
 * The committed value lives in the URL, but typing must not write a query
 * param per keystroke, so the draft is local and only the debounced value is
 * pushed out. `lastPushed` is what keeps the two directions from fighting: it
 * marks the value this input is responsible for, so an external change — the
 * Reset button, a back navigation, a pasted link — is adopted into the draft
 * while our own echo is ignored.
 */
export function ClassificationSearch({
	value,
	onChange,
	placeholder,
	testId,
	className
}: ClassificationSearchProps) {
	const [draft, setDraft] = useState(value);
	const debounced = useDebounce(draft, 300);
	const lastPushed = useRef(value);

	useEffect(() => {
		if (debounced === lastPushed.current) return;

		lastPushed.current = debounced;
		onChange(debounced);
	}, [debounced, onChange]);

	useEffect(() => {
		if (value === lastPushed.current) return;

		lastPushed.current = value;
		setDraft(value);
	}, [value]);

	return (
		<Input
			type="text"
			placeholder={placeholder}
			className={cn('h-7 text-xs', className)}
			value={draft}
			onChange={(event) => setDraft(event.target.value)}
			data-testid={testId}
		/>
	);
}

export interface ExpandButtonProps {
	isExpanded: boolean;
	onClick: () => void;
	/** What expanding reveals — every table shows something different. */
	label: string;
	testId: string;
}

/**
 * The disclosure control for a `renderSubRow` table. Lives here rather than in
 * each table because all three drew the identical chevron and only disagreed on
 * the label, which is exactly the part that should differ.
 */
export function ExpandButton({
	isExpanded,
	onClick,
	label,
	testId
}: ExpandButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-expanded={isExpanded}
			aria-label={label}
			className="grid p-1 rounded place-items-center text-text-menu hover:bg-primary-wash hover:text-primary"
			data-testid={testId}
		>
			<Icon
				name="ArrowShortSmall"
				size={18}
				className={cn(
					'transition-transform',
					isExpanded ? 'rotate-0' : '-rotate-90'
				)}
			/>
		</button>
	);
}
