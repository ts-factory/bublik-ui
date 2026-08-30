/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { Icon, Tooltip, cn } from '@/shared/tailwind-ui';
import type { IconProps } from '@/shared/tailwind-ui';

/**
 * The subset of a classification meta the stripe needs. Every meta map in
 * `classification-colors.ts` already satisfies it, so a stripe is always the
 * same colour as the chips on its row rather than a second opinion.
 */
export interface StatusStripeMeta {
	label: string;
	description: string;
	stripeClassName: string;
	iconName: IconProps['name'];
}

/**
 * Column 0 of every classification table: one saturated block per row, read
 * before anything else on it.
 *
 * The chips answer the same question, but they answer it in the middle of a
 * row among four other chips. Scanning a page for "which of these still need
 * me" meant reading every row; the stripe turns that into looking down one
 * edge. It carries an icon as well as a hue so the distinction survives for
 * readers who cannot separate the two orange-ish states, and the label goes in
 * the tooltip — a 24px column has no room for a word, and the hue is only
 * worth learning once.
 */
export function StatusStripe({ meta }: { meta: StatusStripeMeta }) {
	return (
		<Tooltip content={`${meta.label} — ${meta.description}`}>
			{/*
			 * `inset-0` against the cell's `relative` so the fill spans the row's
			 * full height whatever the tallest cell in it turns out to be — a
			 * height this component cannot know and must not try to.
			 *
			 * `items-start` rather than centred: rows here run to several lines
			 * once an issue carries a few stamps, and a centred icon on a tall
			 * row drifts far from the row's first line, which is where the eye
			 * already is.
			 */}
			<div
				className={cn(
					'absolute inset-0 flex items-start justify-center pt-1.5',
					meta.stripeClassName
				)}
				data-testid="status-stripe"
				data-status={meta.label}
			>
				<Icon name={meta.iconName} size={16} />
			</div>
		</Tooltip>
	);
}

/**
 * `p-0` so the fill reaches the cell's edges rather than sitting in a white
 * frame, and all three width bounds because under `table-auto` a `width` is
 * only advice: the algorithm is free to squeeze a column below it to fit the
 * rest of the row, which it does exactly when the table is crowded — the case
 * where a shrinking stripe is least welcome. `min-w` and `max-w` are what
 * actually pin it, so the gutter is the same 24px on every table at every
 * width.
 *
 * `relative` is the one class held back for the body cells, because the shared
 * key also reaches the `th`, and there `twMerge` reads it as overriding the
 * pinned header's `sticky` and drops it, leaving the header to scroll under
 * the stripes. Everything else stays common so the header sits exactly over
 * the column it heads.
 */
export const STATUS_STRIPE_COLUMN_META = {
	className: 'p-0 w-[24px] min-w-[24px] max-w-[24px]',
	/** `inset-0` resolves against this cell, not the row, which is `relative` too. */
	cellClassName: 'relative'
} as const;
