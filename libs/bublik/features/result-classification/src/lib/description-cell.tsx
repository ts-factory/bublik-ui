/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { Tooltip } from '@/shared/tailwind-ui';

export interface DescriptionCellProps {
	value: string | null | undefined;
}

/**
 * An issue's description, in a table row.
 *
 * Truncated to one line and capped by its column, with the whole text in the
 * tooltip — a description is free-form internal notes and can be a paragraph,
 * so letting it wrap would set the height of every row in the table to the
 * length of the worst one.
 *
 * The em dash is deliberate rather than an empty cell: blank reads as "failed
 * to load" in a row where every other cell has something in it.
 */
export function DescriptionCell({ value }: DescriptionCellProps) {
	const text = value?.trim();

	if (!text) {
		return <span className="text-text-menu">—</span>;
	}

	return (
		<Tooltip content={text}>
			<span className="block min-w-0 truncate text-text-primary">{text}</span>
		</Tooltip>
	);
}
