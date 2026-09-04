/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { Fragment } from 'react';
import { flexRender, type Row } from '@tanstack/react-table';

import { DETAIL_COLUMN_IDS } from '../issue-rules-table.constants';
import type { IssueRuleRow } from '../issue-rules-table.types';

/**
 * What a rule matches on, for a table too narrow to show those columns.
 *
 * The columns are not re-implemented here: their own cells are rendered through
 * `flexRender`, so the chips keep the styling and the click-to-filter behaviour
 * they have in the wide layout. `getAllCells` rather than `getVisibleCells`
 * because these are precisely the columns that are currently hidden.
 */
export function RuleDetail({ row }: { row: Row<IssueRuleRow> }) {
	const cells = row
		.getAllCells()
		.filter(
			(cell) =>
				DETAIL_COLUMN_IDS.includes(cell.column.id) &&
				!cell.column.getIsVisible()
		)
		.sort(
			(a, b) =>
				DETAIL_COLUMN_IDS.indexOf(a.column.id) -
				DETAIL_COLUMN_IDS.indexOf(b.column.id)
		);

	if (!cells.length) return null;

	return (
		<dl
			className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 px-3 pt-1 pb-2.5"
			data-testid="issue-rule-detail"
		>
			{cells.map((cell) => {
				const header = cell.column.columnDef.header;
				const content = flexRender(
					cell.column.columnDef.cell,
					cell.getContext()
				);

				return (
					<Fragment key={cell.id}>
						<dt className="text-[0.6875rem] font-semibold leading-[1.125rem] text-text-menu">
							{typeof header === 'string' ? header : cell.column.id}
						</dt>
						<dd className="text-[0.75rem] leading-[1.125rem] font-medium">
							{content ?? (
								<span className="text-text-menu">&mdash;</span>
							)}
						</dd>
					</Fragment>
				);
			})}
		</dl>
	);
}
