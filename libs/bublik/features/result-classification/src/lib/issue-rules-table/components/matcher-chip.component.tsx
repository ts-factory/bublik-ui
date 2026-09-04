/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { Badge, type BadgeVariants } from '@/shared/tailwind-ui';

import type { FacetControls } from '../../classification-table/classification-table.utils';

export interface MatcherChipProps {
	value: string;
	columnId: string;
	variant?: BadgeVariants;
	className?: string;
	/**
	 * Given, the chip becomes the filter toggle for its own column, so clicking
	 * a tag in a row does what ticking that tag in the toolbar's facet does.
	 * Omitted, it is inert.
	 */
	facets?: FacetControls;
}

/** One matcher value: a tag, a verdict or a parameter. */
export function MatcherChip({
	value,
	columnId,
	variant,
	className,
	facets
}: MatcherChipProps) {
	const isSelected = facets?.values(columnId).includes(value) ?? false;

	return (
		<Badge
			variant={variant}
			overflowWrap
			isSelected={isSelected}
			className={className}
			{...(facets
				? {
						type: 'button' as const,
						onClick: () => facets.toggle(columnId, value)
				  }
				: null)}
		>
			{value}
		</Badge>
	);
}
