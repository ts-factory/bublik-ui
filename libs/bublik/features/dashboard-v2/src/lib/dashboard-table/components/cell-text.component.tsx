/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useLayoutEffect, useState } from 'react';

import { cn, Markdown } from '@/shared/tailwind-ui';
import { DescriptionCell } from '@/bublik/features/result-classification';

import { CellCardRunLink } from './cell-card-link.component';

export interface CellTextProps {
	value: string | number;
	/** The column's name; heads the popover a cut value opens. */
	heading?: string;
	/** The row's run; the popover's header links to it. */
	runId?: number;
	className?: string;
}

/** Characters that give markdown something to do; plain values skip it. */
const MARKDOWN_SYNTAX = /[*_`~#>[\]]|\n/;
const HEADING = /^#{1,6}\s/;

/**
 * Whether the column has cut the line. It latches: a line that was cut once
 * stays so, since the cell then swaps to a trigger of another layout, and
 * measuring that one against this one could flip the two back and forth.
 */
function useWasClipped(node: HTMLElement | null): boolean {
	const [clipped, setClipped] = useState(false);

	useLayoutEffect(() => {
		if (!node || clipped) return;

		const measure = () => {
			if (node.scrollWidth > node.clientWidth) setClipped(true);
		};
		measure();

		const observer = new ResizeObserver(measure);
		observer.observe(node);

		return () => observer.disconnect();
	}, [node, clipped]);

	return clipped;
}

/**
 * A text cell, one line wide. Markdown in it, as in a run comment shown
 * through a `comment` meta category, is rendered inline, with a heading in
 * bold. A value the cell cannot show whole, because the column cuts it or it
 * runs over several lines, opens in full over the cell on click, as an
 * issue's description does in the issues table. The popover is headed by the
 * column's name, with a link to the row's run at the header's right end; a cut
 * badge shows the same card on hover (see `CellLink`).
 */
export const CellText = (props: CellTextProps) => (
	// A new value starts unmeasured.
	<CellTextLine key={String(props.value)} {...props} />
);

function CellTextLine({ value, heading, runId, className }: CellTextProps) {
	const text = String(value);
	const [line, setLine] = useState<HTMLElement | null>(null);
	const wasClipped = useWasClipped(line);
	const lineClassName = HEADING.test(text.trimStart())
		? 'font-semibold'
		: undefined;

	if (wasClipped || text.trim().includes('\n')) {
		return (
			// The trigger pads itself for its hover wash; the negative margin
			// keeps the text where the other cells start theirs. Stretched over
			// the row's height, so the wash fills the row instead of a band
			// around the text.
			<div
				className={cn(
					'flex self-stretch min-w-0 w-[calc(100%+0.75rem)] -mx-1.5',
					className
				)}
			>
				<DescriptionCell
					value={text}
					title={heading ?? ''}
					action={
						runId !== undefined ? <CellCardRunLink runId={runId} /> : null
					}
					overlay
					expandLabel="Show full text"
					lineClassName={lineClassName}
				/>
			</div>
		);
	}

	if (MARKDOWN_SYNTAX.test(text)) {
		return (
			<div
				ref={setLine}
				className={cn(
					'min-w-0 truncate [&_*]:inline',
					lineClassName,
					className
				)}
			>
				<Markdown inline>{text}</Markdown>
			</div>
		);
	}

	return (
		<span ref={setLine} className={cn('block min-w-0 truncate', className)}>
			{value}
		</span>
	);
}
