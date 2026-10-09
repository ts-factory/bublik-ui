/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { ReactNode, forwardRef, useLayoutEffect, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import {
	cn,
	Icon,
	Markdown,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Separator
} from '@/shared/tailwind-ui';

import { BugKeyChip } from './classification-badges.component';
import { DESCRIPTION_MARKDOWN_CLASS } from './classification.constants';

/**
 * The description as a whole block of markdown, in the popover and on the page.
 * Rendered with `breaks`, so a line ends where its author ended it.
 */

interface DescriptionCellProps {
	value: string | null | undefined;
	/** The issue the description belongs to; heads the popover. */
	title: string;
	bugKey: string | null;
	bugUrl: string | null;
	issueId: number;
	/** A closed issue's key is struck through in the popover. */
	closed?: boolean;
	/**
	 * Open the popover over the text instead of beside it, so the text stays
	 * where it was read, as the run table's Objective column does.
	 */
	overlay?: boolean;
}

type DescriptionPopoverProps = Omit<DescriptionCellProps, 'value'> & {
	text: string;
	/** The text the popover opens from; with `overlay` it is laid over it. */
	anchor: HTMLElement | null;
	/**
	 * The anchor shows the text over several lines, so the overlay is held to
	 * its width and wraps them where it does. A one-line anchor shows only the
	 * popover's first line, so the popover can take the width its lines need.
	 */
	wrapsWithAnchor?: boolean;
};

/**
 * Where the text starts inside the popover, below its header: the content's
 * `p-1` (4), the separator (1 + `my-1` 8) and the body's `p-2` (8); and from
 * its left edge: `p-1` + `p-2`.
 */
const POPOVER_TEXT_TOP_BELOW_HEADER = 4 + 9 + 8;
const POPOVER_TEXT_LEFT = 4 + 8;

/** Keeps the popover this far inside the viewport, as `PopoverContent` does. */
const POPOVER_COLLISION_PADDING = 8;

/**
 * Radix offsets that lay the popover's text over the anchor's: from the
 * anchor's bottom edge up to its top, then up by the header and the space
 * above the text, and left by the text's inset.
 */
function overlayOffsets(
	anchorHeight: number,
	headerHeight: number
): { sideOffset: number; alignOffset: number } {
	return {
		sideOffset: -(anchorHeight + POPOVER_TEXT_TOP_BELOW_HEADER + headerHeight),
		alignOffset: -POPOVER_TEXT_LEFT
	};
}

/** The element's rendered height, kept current as it reflows. */
function useElementHeight(node: HTMLElement | null): number {
	const [height, setHeight] = useState(0);

	useLayoutEffect(() => {
		if (!node) return;

		const measure = () => setHeight(node.offsetHeight);
		measure();

		const observer = new ResizeObserver(measure);
		observer.observe(node);

		return () => observer.disconnect();
	}, [node]);

	return height;
}

/**
 * The room the element's vertical scrollbar takes. The body keeps its gutter
 * whether it scrolls or not, so the scrollbar never takes width from the text.
 */
function useScrollbarGutter(node: HTMLElement | null): number {
	const [gutter, setGutter] = useState(0);

	useLayoutEffect(() => {
		if (!node) return;
		setGutter(node.offsetWidth - node.clientWidth);
	}, [node]);

	return gutter;
}

/**
 * The full description, headed by the issue it belongs to. Only the text
 * scrolls; the heading stays in view above it.
 *
 * With `overlay` it is laid over the text it opened from: anchored to that
 * text (see `DescriptionTextAnchor`), lifted by the header and the space
 * above its own text so the two start at the same point. It is as wide as its
 * longest line, code included; over a multi-line anchor, no wider than that
 * anchor, so the lines wrap at the same words. It fades rather than slides in,
 * so nothing moves.
 *
 * Near the viewport's edges it stays on screen instead: it slides sideways,
 * opens upward over the text when there is no room below, and shrinks to the
 * room there is, scrolling its text. The lines no longer match up then.
 */
function DescriptionPopover({
	text,
	title,
	bugKey,
	bugUrl,
	issueId,
	closed,
	overlay,
	anchor,
	wrapsWithAnchor
}: DescriptionPopoverProps) {
	const [header, setHeader] = useState<HTMLDivElement | null>(null);
	// The title wraps, so the header has no fixed height to offset by.
	const headerHeight = useElementHeight(overlay ? header : null);
	// Radix takes the offset as a number, so the anchor is measured too.
	const anchorHeight = useElementHeight(overlay ? anchor : null);
	const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
	const gutter = useScrollbarGutter(overlay ? scroller : null);

	const body = (
		<>
			{/* Headed like a GitHub issue: the title, then its key as the Key
			    column shows it. */}
			<div
				ref={setHeader}
				className="flex flex-wrap items-center px-2 py-1.5 gap-x-2 gap-y-1 shrink-0"
			>
				<h2 className="text-sm font-semibold leading-5 break-words text-text-primary">
					{title}
				</h2>
				<BugKeyChip
					bugKey={bugKey}
					bugUrl={bugUrl}
					issueId={issueId}
					fallback={`#${issueId}`}
					closed={closed}
				/>
			</div>
			<Separator className="h-px my-1 shrink-0" />
			<div
				ref={setScroller}
				className="min-h-0 overflow-auto [scrollbar-gutter:stable]"
				data-testid="description-popover-body"
			>
				<Markdown breaks className={`p-2 ${DESCRIPTION_MARKDOWN_CLASS}`}>
					{text}
				</Markdown>
			</div>
		</>
	);

	// Capped at Tailwind's `max-w-4xl` (56rem), and inside the viewport: wide
	// enough for a log excerpt, narrow enough to read. An overlay sizes itself
	// instead (see its `style`). No taller than the room Radix finds on its side,
	// so the text scrolls rather than running off screen.
	const className =
		'flex flex-col bg-white shadow-popover rounded-lg p-1 max-h-[min(60vh,var(--radix-popover-content-available-height))] max-w-[min(56rem,90vw)] outline-none';

	if (!overlay) {
		return (
			<PopoverContent
				portal
				align="start"
				sideOffset={4}
				className={className}
				data-testid="description-popover"
			>
				{body}
			</PopoverContent>
		);
	}

	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Content
				align="start"
				side="bottom"
				// Given to Radix rather than added on top, so its collision
				// handling sees where the popover really is.
				{...overlayOffsets(anchorHeight, headerHeight)}
				collisionPadding={POPOVER_COLLISION_PADDING}
				className={cn(
					className,
					'z-50 min-w-[min(20rem,90vw)] rdx-state-open:animate-fade-in rdx-state-closed:animate-fade-out'
				)}
				style={{
					width: 'max-content',
					// The text's measure plus its insets and the scrollbar's gutter,
					// so the text itself gets the whole measure.
					maxWidth: `min(calc(${
						wrapsWithAnchor ? 'var(--radix-popover-trigger-width)' : '56rem'
					} + ${2 * POPOVER_TEXT_LEFT + gutter}px), 90vw)`,
					// Held back until the header and the anchor are measured, so it
					// never shows at a first, wrong offset.
					visibility: headerHeight && anchorHeight ? undefined : 'hidden'
				}}
				data-testid="description-popover"
			>
				{body}
			</PopoverPrimitive.Content>
		</PopoverPrimitive.Portal>
	);
}

interface DescriptionTextAnchorProps {
	overlay?: boolean;
	className?: string;
	children: ReactNode;
}

/**
 * Wraps the text a description popover opens from. With `overlay` it becomes
 * the popover's anchor, so the popover lines up with the text itself rather
 * than with the padded trigger around it.
 */
const DescriptionTextAnchor = forwardRef<
	HTMLDivElement,
	DescriptionTextAnchorProps
>(({ overlay, className, children }, ref) =>
	overlay ? (
		<PopoverPrimitive.Anchor ref={ref} className={className}>
			{children}
		</PopoverPrimitive.Anchor>
	) : (
		<div ref={ref} className={className}>
			{children}
		</div>
	)
);
DescriptionTextAnchor.displayName = 'DescriptionTextAnchor';

/** Opens or closes a fenced code block; a marker, not a line of text. */
const CODE_FENCE = /^(```|~~~)/;

/**
 * The line the popover starts with: the first one with text on it, as the
 * author broke it.
 */
function firstLine(text: string): string {
	return (
		text
			.split('\n')
			.map((line) => line.trim())
			.find((line) => line && !CODE_FENCE.test(line)) ?? ''
	);
}

/**
 * The description's first line, cut with an ellipsis; a click opens the full
 * text. Mirrors the run table's Objective column so long descriptions do not
 * stretch the row. Stopping where the author broke the line keeps it the same
 * line the popover laid over it starts with.
 */
function DescriptionCell({ value, overlay, ...issue }: DescriptionCellProps) {
	const [anchor, setAnchor] = useState<HTMLDivElement | null>(null);
	const text = value?.trim();

	if (!text) return null;

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					aria-label="Show full description"
					className="relative flex items-center w-full min-w-0 px-1.5 py-1 text-left group hover:bg-primary-wash"
					data-testid="description-cell"
				>
					<DescriptionTextAnchor
						ref={setAnchor}
						overlay={overlay}
						className="min-w-0"
					>
						{/* Every element inline, so a heading or list item stays on
						    the one line `truncate` cuts. Links open from the popover
						    only. */}
						<Markdown
							inline
							className="block truncate text-text-primary [&_*]:inline [&_a]:pointer-events-none"
						>
							{firstLine(text)}
						</Markdown>
					</DescriptionTextAnchor>
					<span className="absolute top-0 right-0 flex items-center h-full transition-opacity opacity-0 group-hover:opacity-100">
						<span className="w-6 h-full bg-gradient-to-r from-transparent to-primary-wash" />
						<span className="grid h-full pr-1.5 place-items-center bg-primary-wash">
							<Icon name="ChevronDown" size={16} className="text-primary" />
						</span>
					</span>
				</button>
			</PopoverTrigger>
			<DescriptionPopover
				text={text}
				overlay={overlay}
				anchor={anchor}
				{...issue}
			/>
		</Popover>
	);
}

/** Whether the element's content runs past its own (capped) height. */
function useIsClipped(node: HTMLElement | null): boolean {
	const [clipped, setClipped] = useState(false);

	useLayoutEffect(() => {
		if (!node) return;

		const measure = () => setClipped(node.scrollHeight > node.clientHeight);
		measure();

		const observer = new ResizeObserver(measure);
		observer.observe(node);

		return () => observer.disconnect();
	}, [node]);

	return clipped;
}

/**
 * The description on the issue's own page: as much as fits the height of its
 * parent, with the rest a click away in the same popover the tables open.
 * Shown whole, and not clickable, when it fits. The parent sets the height;
 * the block only fills it.
 */
function DescriptionBlock({ value, overlay, ...issue }: DescriptionCellProps) {
	const [node, setNode] = useState<HTMLDivElement | null>(null);
	const clipped = useIsClipped(node);
	const text = value?.trim();

	if (!text) return null;

	const content = (
		<DescriptionTextAnchor
			ref={setNode}
			// Only an open-able block anchors a popover; one that fits has none.
			overlay={overlay && clipped}
			className="relative max-h-full overflow-hidden"
		>
			<Markdown
				breaks
				className={
					clipped
						? `${DESCRIPTION_MARKDOWN_CLASS} [&_a]:pointer-events-none`
						: DESCRIPTION_MARKDOWN_CLASS
				}
			>
				{text}
			</Markdown>
			{clipped ? (
				// Fades the cut-off line out, into the hover wash when hovered.
				<span className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-b from-transparent to-white group-hover:to-primary-wash" />
			) : null}
		</DescriptionTextAnchor>
	);

	if (!clipped)
		return (
			<div className="h-full" data-testid="description-block">
				{content}
			</div>
		);

	return (
		<Popover>
			<PopoverTrigger asChild>
				{/* The negative margins keep the text where it sits unhovered, while
				    the hover wash gets its padding; the height adds that padding
				    back, so the text still gets the parent's full height. */}
				<button
					type="button"
					aria-label="Show full description"
					className="relative block w-full h-[calc(100%+0.5rem)] px-1.5 py-1 -mx-1.5 -my-1 text-left rounded group hover:bg-primary-wash"
					data-testid="description-block"
				>
					{content}
					<span className="absolute grid transition-opacity rounded opacity-0 bottom-1 right-1.5 place-items-center bg-primary-wash group-hover:opacity-100">
						<Icon name="ChevronDown" size={16} className="text-primary" />
					</span>
				</button>
			</PopoverTrigger>
			<DescriptionPopover
				text={text}
				overlay={overlay}
				anchor={node}
				wrapsWithAnchor
				{...issue}
			/>
		</Popover>
	);
}

/**
 * The trigger fills the whole cell, so its hover wash covers the row height:
 * the cell drops its padding and stretches the button, which carries the same
 * padding itself. `min-w-0` lets the grid track cut the line instead of
 * growing to fit it.
 *
 * `fit-content` hugs the text up to the popover's own cap (`max-w-4xl`), so
 * the line and the popover laid over it are the same measure. A
 * `minmax(…, 56rem)` track would be maximised to its cap before the table's
 * end gutter got any surplus, taking the width even over empty descriptions.
 */
const DESCRIPTION_COLUMN_META = {
	width: 'fit-content(56rem)',
	cellClassName: 'p-0 items-stretch min-w-0'
} as const;

export {
	DescriptionBlock,
	DescriptionCell,
	DESCRIPTION_COLUMN_META,
	overlayOffsets
};
export type { DescriptionCellProps };
