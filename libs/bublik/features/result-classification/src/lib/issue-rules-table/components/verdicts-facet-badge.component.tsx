/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { Badge, BadgeVariants, cn } from '@/shared/tailwind-ui';

import { FACET_CHIP_CLASS } from '../../classification/facet-badges.component';
import { NO_VERDICTS_TEXT } from '../../rule-form/matcher-fields.utils';
import {
	parseVerdictsKey,
	VERDICTS_IGNORED_TEXT
} from '../issue-rules-table.utils';

/**
 * One option of the Verdicts filter: a rule's whole verdict list, drawn as
 * the Verdicts column draws it, a chip per verdict, so the option reads as
 * the cell it would keep. The two lists without chips say what they stand
 * for: no verdicts, or verdicts not matched on at all.
 */
export function VerdictsFacetBadge({ value }: { value: string }) {
	const verdicts = parseVerdictsKey(value);

	if (verdicts === null) {
		return (
			<Badge
				variant={BadgeVariants.Neutral}
				className={cn(FACET_CHIP_CLASS, 'italic')}
			>
				{VERDICTS_IGNORED_TEXT}
			</Badge>
		);
	}

	if (!verdicts.length) {
		return (
			<Badge variant={BadgeVariants.Transparent} className={FACET_CHIP_CLASS}>
				{NO_VERDICTS_TEXT}
			</Badge>
		);
	}

	return (
		<span className="flex flex-wrap gap-1">
			{verdicts.map((verdict, index) => (
				<Badge
					// A verdict may repeat within one list, as it may in a result.
					key={`${index}:${verdict}`}
					variant={BadgeVariants.Transparent}
					className={FACET_CHIP_CLASS}
				>
					{verdict}
				</Badge>
			))}
		</span>
	);
}
