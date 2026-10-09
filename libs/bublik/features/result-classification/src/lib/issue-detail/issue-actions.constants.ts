/**
 * The Actions column: the last column of every classification table, holding
 * icon-only buttons that act on the row. `auto` so it hugs the buttons, and the
 * cells right-align so the icons line up along the edge whatever the row. The
 * tables with a gutter put it just before this column (`gutterBefore`), so
 * the buttons sit on the right edge, in line with the toolbar's.
 */
export const ISSUE_ACTIONS_COLUMN_META = {
	width: 'auto',
	headerClassName: 'justify-end pr-[26px]',
	cellClassName: 'justify-end'
} as const;
