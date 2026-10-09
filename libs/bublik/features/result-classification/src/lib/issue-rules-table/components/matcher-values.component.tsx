/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { Badge, type BadgeVariants } from '@/shared/tailwind-ui';

import type { FacetControls } from '../../classification-table/classification-table.utils';
import { MatcherChip } from './matcher-chip.component';

export function MatcherValues({
	values,
	none,
	formatLabel,
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
	columnId: string;
	variant?: BadgeVariants;
	className?: string;
	facets?: FacetControls;
}) {
	if (!values.length) {
		return none ? (
			<Badge variant={variant} className={className} isInteractive={false}>
				{none}
			</Badge>
		) : null;
	}

	return (
		<div className="flex flex-wrap gap-1">
			{values.map((value) => (
				<MatcherChip
					key={value}
					value={value}
					label={formatLabel?.(value)}
					columnId={columnId}
					variant={variant}
					className={className}
					facets={facets}
				/>
			))}
		</div>
	);
}
