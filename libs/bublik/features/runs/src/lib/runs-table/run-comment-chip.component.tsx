/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useRef, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import { routes } from '@/router';
import {
	ButtonTw,
	cn,
	Icon,
	Markdown,
	Popover,
	PopoverAnchor,
	PopoverTrigger,
	Tooltip
} from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import {
	DESCRIPTION_MARKDOWN_CLASS,
	DESCRIPTION_SURFACE_CLASS,
	DescriptionPanel,
	overlayOffsets,
	useElementHeight
} from '@/bublik/features/result-classification';

import { runCommentPreview } from './run-comment.utils';

/**
 * Sits on the row's top border as the result table's "Use as baseline" does:
 * the upper half in the gap above the row, the lower half in the cell's top
 * padding. `w-max` and `whitespace-nowrap`: an absolute box is otherwise as
 * wide as its cell lets it be.
 */
const ROW_CORNER_CLASS =
	'absolute -top-3 left-1 inline-flex h-[1.375rem] w-max max-w-[32rem] items-center whitespace-nowrap rounded border border-border-primary bg-bg-primary p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20';

/**
 * The chip's text, and the comment's in the popover laid over it: the same
 * size, weight and line height, so its first line reads on where the chip's
 * was. The line fills the chip's height inside its border and padding.
 */
const COMMENT_TEXT_CLASS = 'text-[0.6875rem] font-medium leading-[1.125rem]';

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
	// Radix takes its offsets as numbers, so the chip's line and the popover's
	// header, whose title could wrap, are measured. The line is measured as the
	// popover opens, which spares the table an observer per row.
	const line = useRef<HTMLSpanElement | null>(null);
	const [lineHeight, setLineHeight] = useState(0);
	const [header, setHeader] = useState<HTMLDivElement | null>(null);
	const headerHeight = useElementHeight(isOpen ? header : null);
	const overlay = overlayOffsets(lineHeight, headerHeight);

	function handleOpenChange(open: boolean) {
		if (open) setLineHeight(line.current?.offsetHeight ?? 0);
		setIsOpen(open);
	}

	function handleEdit() {
		setIsOpen(false);
		onEdit();
	}

	return (
		// The row selects on a click, and the popover is its React child
		// wherever it is in the DOM.
		<div className="contents" onClick={(event) => event.stopPropagation()}>
			{comment ? (
				<Popover open={isOpen} onOpenChange={handleOpenChange}>
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
							{/* The popover's anchor is the line itself, not the padded
							    chip, so its text starts where the line does. */}
							<PopoverAnchor asChild>
								<span ref={line} className="mx-1.5 block min-w-0">
									<Markdown
										inline
										className={cn(
											COMMENT_TEXT_CLASS,
											'block truncate [&_*]:inline [&_a]:pointer-events-none',
											preview.isHeading && 'font-semibold'
										)}
									>
										{preview.text}
									</Markdown>
								</span>
							</PopoverAnchor>
						</button>
					</PopoverTrigger>
					{/* Laid over the chip as the run page's comment opens over its
					    text: lifted by the header and the space above its own text,
					    so the comment reads on from where the chip shows it. It
					    fades rather than slides in, so nothing moves. */}
					<PopoverPrimitive.Portal>
						<PopoverPrimitive.Content
							side="bottom"
							align="start"
							// Given to Radix rather than added on top, so its collision
							// handling sees where the popover really is.
							{...overlay}
							collisionPadding={8}
							data-testid="run-comment-popover"
							// Focus goes to the popover, not to its first button, whose
							// tooltip would open over the text.
							onOpenAutoFocus={(event) => {
								event.preventDefault();
								if (event.currentTarget instanceof HTMLElement) {
									event.currentTarget.focus();
								}
							}}
							className={cn(
								DESCRIPTION_SURFACE_CLASS,
								'z-50 max-h-[min(60vh,var(--radix-popover-content-available-height))] min-w-[min(20rem,90vw)] rdx-state-open:animate-fade-in rdx-state-closed:animate-fade-out'
							)}
							// Held back until the header and the line are measured, so it
							// never shows at a first, wrong offset.
							style={{
								visibility: headerHeight && lineHeight ? undefined : 'hidden'
							}}
						>
							<DescriptionPanel
								title={`Run ${runId}`}
								headerRef={setHeader}
								action={
									<>
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
									</>
								}
							>
								<Markdown
									breaks
									className={cn(
										'p-2',
										DESCRIPTION_MARKDOWN_CLASS,
										COMMENT_TEXT_CLASS
									)}
								>
									{comment}
								</Markdown>
							</DescriptionPanel>
						</PopoverPrimitive.Content>
					</PopoverPrimitive.Portal>
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
