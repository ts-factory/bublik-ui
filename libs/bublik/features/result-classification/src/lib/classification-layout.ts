/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useMeasure } from '@/shared/hooks';

/**
 * How wide a classification table has to be before its filler column earns its
 * keep.
 *
 * The filler exists to absorb the slack of a `w-full` `table-auto` table, so
 * the columns declared `w-px whitespace-nowrap` actually shrink to their
 * contents instead of sharing the spare width out. On a wide monitor that is
 * the whole point. Below these numbers there is no slack worth parking, and
 * the empty column just pins every real column to its minimum and crowds the
 * row into the left third of the screen — so it stands down and the column
 * holding the issue takes the width back.
 *
 * Measured against the *table's* width rather than the viewport's, which is
 * why there is one number per table and not one per sidebar state: the sidebar
 * is 252px open and 56px collapsed, so "1500 collapsed / 1700 expanded" is a
 * single content width of about 1445 either way.
 *
 * Tune freely — these are the only numbers involved.
 */
export const FILLER_MIN_WIDTH = {
	runIssues: 1450,
	issues: 1450,
	/** Wider: this table carries four more columns before the issue title. */
	issueRules: 1650
} as const;

/**
 * Attach the ref to the table's outer shell; the flag says whether the filler
 * column should be shown at the width that shell currently has.
 */
export function useFillerVisible(minWidth: number) {
	const [ref, { width }] = useMeasure<HTMLDivElement>();

	// Width is 0 for the first render, before the ResizeObserver has fired.
	// Read that as wide: the filler is the steady state on the screens these
	// tables are usually read on, so this is the layout that does not flash.
	return [ref, width === 0 || width >= minWidth] as const;
}
