/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { Badge, type BadgeVariants } from '@/shared/tailwind-ui';

import type { FacetControls } from '../../classification-table/classification-table.utils';
import { MatcherChip } from './matcher-chip.component';

export function MatcherValues({
	values,
	none,
	formatLabel,
	filterValue,
	columnId,
	variant,
	className,
	facets
}: {
	values: string[];
	/** What stands for an empty list that is still matched on; else nothing. */
	none?: string;
	/** The label for a value, when it is shown differently than it is filtered. */
	formatLabel?: (value: string) => string;
	/**
	 * What every chip filters on, when the values filter as one rather than
	 * each on its own: a verdict list, matched whole. The `none` badge then
	 * filters on it too, as the empty list is a list of its own.
	 */
	filterValue?: string;
	columnId: string;
	variant?: BadgeVariants;
	className?: string;
	facets?: FacetControls;
}) {
	if (!values.length) {
		if (!none) return null;

		return filterValue !== undefined ? (
			<MatcherChip
				value={none}
				filterValue={filterValue}
				columnId={columnId}
				variant={variant}
				className={className}
				facets={facets}
			/>
		) : (
			<Badge variant={variant} className={className} isInteractive={false}>
				{none}
			</Badge>
		);
	}

	return (
		<div className="flex flex-wrap gap-1">
			{values.map((value) => (
				<MatcherChip
					key={value}
					value={value}
					label={formatLabel?.(value)}
					filterValue={filterValue}
					columnId={columnId}
					variant={variant}
					className={className}
					facets={facets}
				/>
			))}
		</div>
	);
}
