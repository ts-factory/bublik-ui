/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useState } from 'react';

import { routes } from '@/router';
import {
	ButtonTw,
	cn,
	Icon,
	Markdown,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Separator,
	Tooltip
} from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import { DESCRIPTION_MARKDOWN_CLASS } from '@/bublik/features/result-classification';

import { runCommentPreview } from './run-comment.utils';

/**
 * Sits on the row's top border as the result table's "Use as baseline" does:
 * the upper half in the gap above the row, the lower half in the cell's top
 * padding. `w-max` and `whitespace-nowrap`: an absolute box is otherwise as
 * wide as its cell lets it be.
 */
const ROW_CORNER_CLASS =
	'absolute -top-3 left-1 inline-flex h-[1.375rem] w-max max-w-[32rem] items-center whitespace-nowrap rounded border border-border-primary bg-bg-primary p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20';

/** Above the sticky header (`z-10`) while the row is below it, under it once not. */
function rowCornerLayer(overHeader: boolean): string {
	return overHeader ? 'z-[11]' : 'z-[1]';
}

interface RunCommentChipProps {
	runId: number;
	/** The run's comment, or an empty string: the chip then offers to add one. */
	comment: string;
	isRowHovered: boolean;
	/** Whether the comment editor is open for this run. */
	isEditing: boolean;
	overHeader: boolean;
	onEdit: () => void;
}

function RunCommentChip(props: RunCommentChipProps) {
	const { runId, comment, isRowHovered, isEditing, overHeader, onEdit } = props;
	const [isOpen, setIsOpen] = useState(false);
	const preview = runCommentPreview(comment);

	function handleEdit() {
		setIsOpen(false);
		onEdit();
	}

	return (
		// The row selects on a click, and the popover is its React child
		// wherever it is in the DOM.
		<div className="contents" onClick={(event) => event.stopPropagation()}>
			{comment ? (
				<Popover open={isOpen} onOpenChange={setIsOpen}>
					<PopoverTrigger asChild>
						<button
							type="button"
							aria-label="Show run comment"
							data-testid="run-comment-chip"
							className={cn(
								ROW_CORNER_CLASS,
								rowCornerLayer(overHeader),
								'text-left text-text-primary transition-colors hover:border-primary hover:text-primary',
								(isOpen || isEditing) && 'border-primary text-primary'
							)}
						>
							<Markdown
								inline
								className={cn(
									'block min-w-0 truncate px-1.5 text-[0.6875rem] font-medium leading-none [&_*]:inline [&_a]:pointer-events-none',
									preview.isHeading && 'font-semibold'
								)}
							>
								{preview.text}
							</Markdown>
						</button>
					</PopoverTrigger>
					<PopoverContent
						portal
						align="start"
						sideOffset={4}
						data-testid="run-comment-popover"
						// Focus goes to the popover, not to its first button, whose
						// tooltip would open over the text.
						onOpenAutoFocus={(event) => {
							event.preventDefault();
							if (event.currentTarget instanceof HTMLElement) {
								event.currentTarget.focus();
							}
						}}
						className="flex max-h-[60vh] max-w-[min(56rem,90vw)] flex-col rounded-lg bg-bg-elevated p-1 shadow-popover outline-none"
					>
						<div className="flex items-center justify-between gap-4 px-2 py-1.5">
							<h2 className="text-sm font-semibold leading-5 text-text-primary">
								Run {runId}
							</h2>
							<div className="flex items-center gap-1">
								<Tooltip content="Edit Run Comment">
									<ButtonTw
										variant="secondary"
										size="xss"
										className="size-6 shrink-0"
										onClick={handleEdit}
									>
										<Icon name="Edit" className="size-5 shrink-0" />
										<span className="sr-only">Edit</span>
									</ButtonTw>
								</Tooltip>
								{/* The Run link of the Actions column. */}
								<ButtonTw asChild variant="secondary" size="xss">
									<LinkWithProject to={routes.run({ runId })}>
										<Icon name="BoxArrowRight" className="mr-1.5" />
										Run
									</LinkWithProject>
								</ButtonTw>
							</div>
						</div>
						<Separator className="my-1 h-px shrink-0" />
						<div className="min-h-0 overflow-auto">
							<Markdown
								breaks
								className={cn('p-2', DESCRIPTION_MARKDOWN_CLASS)}
							>
								{comment}
							</Markdown>
						</div>
					</PopoverContent>
				</Popover>
			) : (
				// Always there for the keyboard; seen on a hovered or focused row.
				<button
					type="button"
					data-testid="run-comment-add"
					className={cn(
						ROW_CORNER_CLASS,
						rowCornerLayer(overHeader),
						'group transition-opacity',
						isRowHovered || isEditing
							? 'opacity-100'
							: 'pointer-events-none opacity-0 focus-visible:opacity-100'
					)}
					onClick={onEdit}
				>
					<span
						className={cn(
							'inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase leading-[0.75rem] tracking-[0.02em] text-text-primary transition-colors group-hover:bg-primary-wash group-hover:text-primary',
							isEditing && 'bg-primary-wash text-primary'
						)}
					>
						<Icon name="AddSymbol" size={10} />
						Add comment
					</span>
				</button>
			)}
		</div>
	);
}

export { RunCommentChip };
export type { RunCommentChipProps };
