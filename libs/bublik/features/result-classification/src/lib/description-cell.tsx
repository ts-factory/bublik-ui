/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { Tooltip } from '@/shared/tailwind-ui';

export interface DescriptionCellProps {
	value: string | null | undefined;
}

/**
 * An issue's description, in a table row.
 *
 * Wrapped, with its line breaks intact — these are free-form internal notes and
 * the newlines in them are usually the structure. It used to be clipped to one
 * line with the rest in a tooltip, which made the one column carrying prose the
 * one column you could not read.
 *
 * Clamped to three lines, because unclamped it set the height of the row to the
 * length of the worst description in the table. Three is enough to read the
 * gist; the tooltip has the rest, and it only appears when there *is* a rest.
 *
 * Nothing bounds the width here: the column's track does that, and the column
 * sits last precisely so the text has somewhere to run.
 *
 * Empty renders nothing. A placeholder dash was there to stop a blank cell
 * reading as "failed to load", but most issues carry no description, so what it
 * actually produced was a column of dashes — noise in every row, drawing the
 * eye to the one thing that has nothing to say.
 */
export function DescriptionCell({ value }: DescriptionCellProps) {
	const text = value?.trim();

	if (!text) return null;

	return (
		<Tooltip content={text}>
			<span className="block min-w-0 whitespace-pre-wrap break-words line-clamp-3 text-text-primary">
				{text}
			</span>
		</Tooltip>
	);
}
