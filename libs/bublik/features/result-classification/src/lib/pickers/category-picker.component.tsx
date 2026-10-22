/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useId, useState, type RefObject } from 'react';
import { CheckIcon } from '@radix-ui/react-icons';
import { PopoverPortal } from '@radix-ui/react-popover';

import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	FLOATING_LABEL_BACKDROP_CLASS,
	Icon,
	InputLabel,
	Popover,
	PopoverContent,
	PopoverTrigger,
	cn
} from '@/shared/tailwind-ui';
import type { IssueCategory } from '@/shared/types';

import { CategoryBadge } from '../classification/classification-badges.component';
import {
	CATEGORY_META,
	CATEGORY_ORDER
} from '../classification/classification.constants';
import { FieldHint } from '../shared/select-options';
import { comboboxInputStyles } from './pickers.styles';

export interface CategoryPickerProps {
	value: readonly string[];
	onChange: (next: string[]) => void;
	label?: string;
	container?: RefObject<HTMLElement>;
}

/**
 * The Category field of the classify form: every picked category shows as
 * its badge in the field, in the tables' order, and the list behind it is the
 * tables' faceted filter — a search over the badges, a box per category —
 * except that it picks what the rules say rather than what the rows show.
 * One rule is created per picked category, so the field never empties itself:
 * with no category there is nothing to classify as, which the form rejects.
 */
export function CategoryPicker({
	value,
	onChange,
	label = 'Category',
	container
}: CategoryPickerProps) {
	const id = useId();
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState('');
	const selected = new Set(value);
	const picked = CATEGORY_ORDER.filter((category) => selected.has(category));
	const only = picked.length === 1 ? picked[0] : undefined;

	function toggle(category: IssueCategory) {
		// Kept in the list's order, whatever order the boxes were ticked in.
		onChange(
			CATEGORY_ORDER.filter((candidate) =>
				candidate === category
					? !selected.has(candidate)
					: selected.has(candidate)
			)
		);
	}

	return (
		<Popover
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (!next) setSearch('');
			}}
		>
			<div className="relative">
				<InputLabel
					className={cn(
						'absolute top-[-11px] left-2 z-10',
						FLOATING_LABEL_BACKDROP_CLASS
					)}
					htmlFor={id}
				>
					{label}
				</InputLabel>
				<PopoverTrigger asChild>
					<button
						type="button"
						id={id}
						role="combobox"
						aria-expanded={open}
						aria-controls={`${id}-list`}
						aria-haspopup="listbox"
						className={cn(
							comboboxInputStyles(),
							'flex items-center gap-1.5 text-left pr-10 min-h-[40px]',
							open && 'border-primary shadow-text-field'
						)}
						data-testid="classify-category-trigger"
					>
						{picked.length ? (
							<span className="flex flex-wrap items-center gap-1.5">
								{picked.map((category) => (
									<CategoryBadge key={category} category={category} />
								))}
							</span>
						) : (
							<span className="font-normal text-text-menu">
								Pick at least one category…
							</span>
						)}
						<Icon
							name="ArrowShortTop"
							className={cn(
								'absolute -translate-y-1/2 right-3.5 top-1/2 size-[18px] text-text-menu transition-transform',
								open ? 'rotate-0' : 'rotate-180'
							)}
						/>
					</button>
				</PopoverTrigger>
			</div>
			{/* The help line the single pick earns: the badge says the category,
			    this says what it means. Several badges speak for themselves. */}
			{only ? (
				<FieldHint testId="select-hint">
					{CATEGORY_META[only].description}
				</FieldHint>
			) : picked.length > 1 ? (
				<FieldHint testId="select-hint">
					A rule per category: {picked.length} rules.
				</FieldHint>
			) : null}

			<PopoverPortal container={container?.current ?? undefined}>
				<PopoverContent
					className="z-[60] p-0 bg-bg-elevated rounded-lg shadow-popover w-[var(--radix-popover-trigger-width)]"
					align="start"
					sideOffset={4}
					onOpenAutoFocus={(event) => event.preventDefault()}
					id={`${id}-list`}
					data-testid="classify-category-popup"
				>
					<Command>
						<CommandInput
							autoFocus
							placeholder="Search categories…"
							className="text-xs"
							value={search}
							onValueChange={setSearch}
							startIcon={
								<Icon
									name="MagnifyingGlass"
									size={18}
									className="opacity-50 shrink-0"
								/>
							}
						/>
						<CommandList className="max-h-72 overflow-y-auto">
							<CommandEmpty className="py-4 text-xs text-center">
								No such category.
							</CommandEmpty>
							{/* One grid for every row: the badge column is as wide as the
							    widest badge, so the descriptions start on one line. A row's
							    own padding would be cut out of its first and last tracks
							    (subgrid), so the rows have none and the inset is the box's
							    margin on the left and the description's on the right. */}
							<CommandGroup className="[&_[cmdk-group-items]]:grid [&_[cmdk-group-items]]:grid-cols-[1.5rem_max-content_minmax(0,1fr)]">
								{CATEGORY_ORDER.map((category) => {
									const meta = CATEGORY_META[category];
									const isSelected = selected.has(category);

									return (
										<CommandItem
											key={category}
											value={meta.label}
											keywords={[meta.displayValue, meta.description]}
											role="checkbox"
											aria-checked={isSelected}
											onSelect={() => toggle(category)}
											className="col-span-full grid grid-cols-subgrid items-center gap-x-3 px-0"
											data-testid="classify-category-option"
											data-category={category}
											data-state={isSelected ? 'checked' : 'unchecked'}
										>
											<div
												className={cn(
													'ml-2 flex h-4 w-4 items-center justify-center rounded-sm border border-text-menu',
													isSelected
														? 'bg-primary text-white border-primary'
														: 'opacity-50 [&_svg]:invisible'
												)}
											>
												<CheckIcon className="h-4 w-4" />
											</div>
											<CategoryBadge category={category} />
											<span className="min-w-0 pr-2 text-xs font-normal text-text-menu">
												{meta.description}
											</span>
										</CommandItem>
									);
								})}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</PopoverPortal>
		</Popover>
	);
}
