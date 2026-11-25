/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ColumnDef, Row } from '@tanstack/react-table';

import {
	DashboardAPIResponse,
	DashboardCellArray,
	DashboardCellData,
	DashboardData,
	RUN_STATUS
} from '@/shared/types';
import {
	BadgeVariants,
	badgeSelectedStyles,
	badgeVariantStyles
} from '@/shared/tailwind-ui';

import { getColorFromContext } from '../utils';

export const isRowError = (row: Row<DashboardData>) => {
	return row.original.context.conclusion === RUN_STATUS.Error;
};

export const getColumnWidth = (
	rows: DashboardData[],
	accessor: string,
	headerText: string
) => {
	const MAX_WIDTH = 400;
	const MAGIC_SPACING = 14;

	const maxLengthInColumn = getMaxLengthInColumn(rows, accessor);
	const maxLength = Math.max(maxLengthInColumn, headerText.length);

	return Math.min(MAX_WIDTH, maxLength * MAGIC_SPACING + 128);
};

/**
 * Grid tracks for the data columns, keyed by column key.
 *
 * Every column is an `fr` track weighted by the length of its longest value,
 * so leftover width is shared in proportion to the content, as the flex
 * layout did, and a sparse day does not hand it all to one column. The
 * weights have no fixed base (unlike `getColumnWidth`): short columns are
 * light, so on a narrow row they stay near their content and the long text
 * columns keep as much as possible. The columns differ in how far they may
 * shrink: numbers and short text stop at their content width (`min-content`,
 * so a header's sort arrow may give way but a number never truncates); long
 * text columns truncate, but keep room for their first characters, so a
 * deficit lands on the longest column first and a short name next to a long
 * configuration stays readable.
 */
export const getColumnTracks = (
	rows: DashboardData[],
	headers: DashboardAPIResponse['header']
) => {
	// Text this long may truncate; anything shorter is kept whole.
	const TRUNCATE_MIN_LENGTH = 11;
	const MAX_WEIGHT = 30;
	// About ten characters at the cell's font plus the cell's padding, and
	// the badge's padding where the column has badges. The percentages keep
	// a few such floors from overflowing a very narrow row.
	const TEXT_FLOOR = 'min(4.25rem, 14%)';
	const BADGE_FLOOR = 'min(5.25rem, 17%)';

	const columns = headers.map(({ key, name }) => {
		const isNumeric = isNumericColumn(rows, key);
		const maxLength = getMaxLengthInColumn(rows, key);

		return {
			key,
			isNumeric,
			weight: Math.min(MAX_WEIGHT, Math.max(maxLength, name.length)),
			truncates: !isNumeric && maxLength >= TRUNCATE_MIN_LENGTH,
			floor: columnHasBadges(rows, key) ? BADGE_FLOOR : TEXT_FLOOR
		};
	});

	return new Map(
		columns.map(({ key, weight, truncates, isNumeric, floor }) => {
			const track = truncates
				? `minmax(${floor}, ${weight}fr)`
				: `minmax(min-content, ${weight}fr)`;

			return [key, { track, shrinks: truncates || !isNumeric }];
		})
	);
};

export const getMaxLengthInColumn = (
	rows: DashboardData[],
	accessor: string
) => {
	return rows.reduce((acc, curr) => {
		const data = curr.row_cells[accessor];

		if (Array.isArray(data)) {
			return Math.max(acc, getCellStrFromArray(data).length);
		}

		const length = data?.value?.toString()?.length ?? 0;

		return Math.max(acc, length);
	}, 0);
};

const NUMERIC_VALUE = /^-?\d+([.,]\d+)?%?$/;

/**
 * A column whose every present value is a number (optionally with a `%`
 * suffix) is right-aligned so the digits line up.
 */
export const isNumericColumn = (rows: DashboardData[], accessor: string) => {
	let seen = false;

	for (const row of rows) {
		const cell = row.row_cells[accessor];

		if (Array.isArray(cell)) return false;

		const value = cell?.value;

		if (value === undefined || value === null || value === '') continue;

		if (!NUMERIC_VALUE.test(String(value).trim())) return false;

		seen = true;
	}

	return seen;
};

/** Link cells render as padded badges; the column's header follows them. */
export const columnHasBadges = (rows: DashboardData[], accessor: string) => {
	return rows.some((row) => {
		const cell = row.row_cells[accessor];

		return !Array.isArray(cell) && Boolean(cell?.payload);
	});
};

export const getGridTemplateColumns = (columns: ColumnDef<DashboardData>[]) => {
	return columns
		.map((column) => column.meta?.width ?? 'minmax(0, 1fr)')
		.join(' ');
};

export const getCellStrFromArray = (arr: DashboardCellArray[]) => {
	return arr
		.map((data) => data.value)
		.filter((str) => str)
		.join(', ');
};

/**
 * The description the API sends in `payload` for a column whose config sets
 * `payload: go_run_failed`. The cells carry the same link as `go_run`, so
 * this is the only thing that tells the NOK column apart.
 */
const GO_RUN_FAILED_DESCRIPTION = 'Go to Run (Preview NOK)';

/**
 * NOK badges take the fill of the run page's unexpected columns. A run with
 * no unexpected results has nothing to flag, so its 0 is outlined like a
 * verdict badge in the result table. The outline is an inset ring rather than
 * a border, so the badge keeps the other badges' size.
 *
 * An error row has the same fill as the badge, so there the badge is solid
 * red under white ink, as the run page's unexpected badges are when selected.
 */
const NOK_BADGE_CLASS = {
	ok: 'bg-transparent ring-1 ring-inset ring-border-input',
	nok: badgeVariantStyles({ variant: BadgeVariants.UnexpectedActive }),
	nokOnErrorRow: badgeSelectedStyles({
		variant: BadgeVariants.UnexpectedActive
	})
} as const;

/**
 * Badge colour per column, keyed by column key.
 *
 * Columns are coloured in header order, counting only those that carry a
 * badge in at least one row, so two tables of the same day (or two days
 * with the same columns) agree. Picking a single row for this went wrong
 * when a column, like Test Suite, has a badge only in some rows: the other
 * columns' indices shifted by one depending on the row. A column whose
 * cells carry a context takes the context colour instead, and the
 * `go_run_failed` (NOK) column is red, but outlined where its count is 0. Both
 * still take their index, so the columns after them keep their colours.
 */
export const createColorMap = (
	rows: DashboardAPIResponse['rows'],
	headers: DashboardAPIResponse['header'],
	payload: DashboardAPIResponse['payload'] = {}
) => {
	const colorMap = new Map<string, string>();
	const nokKeys = new Set<string>();

	const getColorByKey = (key: string) => colorMap.get(key);

	/** The colour of one cell: its column's, or for a NOK of 0 the outline. */
	const getCellColor = (key: string, value: unknown, onErrorRow = false) => {
		if (!nokKeys.has(key)) return getColorByKey(key);
		if (Number(value) === 0) return NOK_BADGE_CLASS.ok;

		return onErrorRow ? NOK_BADGE_CLASS.nokOnErrorRow : NOK_BADGE_CLASS.nok;
	};

	let badgeIndex = 0;

	headers.forEach(({ key }) => {
		const badges = rows
			.map((row) => row.row_cells[key])
			.filter(
				(cell): cell is DashboardCellData =>
					!!cell && !Array.isArray(cell) && !!cell.payload
			);

		if (!badges.length) return;

		const context = badges.find((cell) => cell.context)?.context;
		const isNokColumn =
			!context && payload[key]?.trim() === GO_RUN_FAILED_DESCRIPTION;

		if (isNokColumn) nokKeys.add(key);

		colorMap.set(
			key,
			context
				? getColorFromContext(context)
				: isNokColumn
				? NOK_BADGE_CLASS.nok
				: `bg-badge-${badgeIndex}`
		);

		badgeIndex += 1;
	});

	return { getColorByKey, getCellColor };
};
