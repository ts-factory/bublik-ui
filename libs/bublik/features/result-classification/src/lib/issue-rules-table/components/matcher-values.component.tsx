/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { BadgeVariants } from '@/shared/tailwind-ui';

import type { FacetControls } from '../../classification-table/classification-table.utils';
import { MatcherChip } from './matcher-chip.component';

export function MatcherValues({
	values,
	columnId,
	variant,
	className,
	facets
}: {
	values: string[];
	columnId: string;
	variant?: BadgeVariants;
	className?: string;
	facets?: FacetControls;
}) {
	// Nothing renders for an unconstrained criterion. It is the common case —
	// most rules pin one axis and leave the other two open — so a placeholder
	// would put a dash in most cells of three columns.
	if (!values.length) return null;

	return (
		<div className="flex flex-wrap gap-1">
			{values.map((value) => (
				<MatcherChip
					key={value}
					value={value}
					columnId={columnId}
					variant={variant}
					className={className}
					facets={facets}
				/>
			))}
		</div>
	);
}
