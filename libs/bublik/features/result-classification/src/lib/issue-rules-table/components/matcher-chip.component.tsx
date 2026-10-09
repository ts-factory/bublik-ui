/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { Badge, type BadgeVariants } from '@/shared/tailwind-ui';

import type { FacetControls } from '../../classification-table/classification-table.utils';

export interface MatcherChipProps {
	/** What the chip filters on — the value as the rule captured it. */
	value: string;
	/** What the chip shows, when that differs from `value`. */
	label?: string;
	columnId: string;
	variant?: BadgeVariants;
	className?: string;
	facets?: FacetControls;
}

export function MatcherChip({
	value,
	label = value,
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
			{label}
		</Badge>
	);
}
