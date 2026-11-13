/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	Badge,
	BadgeVariants,
	IconButton,
	Tooltip
} from '@/shared/tailwind-ui';

import { NO_VERDICTS_TEXT } from '../rule-form/matcher-fields.utils';
import {
	SCOPE_ROW_CLASS,
	SCOPE_ROW_EMPTY_CLASS,
	SCOPE_ROW_LABEL_CLASS
} from './pickers.styles';

export interface VerdictListsProps {
	/** What a rule does with the verdicts, shown on the label. */
	hint: string;
	/** The verdict lists the rule's results failed with, a stored rule each. */
	lists: readonly (readonly string[])[];
	kept: boolean;
	onChange: (kept: boolean) => void;
	testId?: string;
}

/**
 * The Verdicts row of a rule in the match scope. The server matches verdicts
 * exactly, so there is nothing to pick from: the rule keeps every list its
 * results failed with, a stored rule per list, or matches on no verdict at
 * all. The row shows the lists as the other rows show their chips, a line
 * each, with the bin to drop them; dropped, the bin's place takes the arrow
 * that brings them back.
 */
export function VerdictLists({
	hint,
	lists,
	kept,
	onChange,
	testId
}: VerdictListsProps) {
	return (
		<div className={SCOPE_ROW_CLASS} data-testid={testId} data-kept={kept}>
			<Tooltip content={hint}>
				<span className={SCOPE_ROW_LABEL_CLASS}>Verdicts</span>
			</Tooltip>
			<div className="flex min-h-[26px] flex-col justify-center gap-1">
				{kept ? (
					lists.map((list) => (
						<div
							key={list.join('\u0000')}
							className="flex flex-wrap items-center gap-1"
							data-testid="match-scope-verdict-list"
						>
							{list.length ? (
								list.map((verdict) => (
									<Badge
										key={verdict}
										as="span"
										isInteractive={false}
										variant={BadgeVariants.Transparent}
										className="text-xs"
										overflowWrap
										data-testid="scope-value-chip"
										data-value={verdict}
									>
										{verdict}
									</Badge>
								))
							) : (
								<Badge
									as="span"
									isInteractive={false}
									variant={BadgeVariants.Transparent}
									className="text-xs italic"
									data-testid="scope-value-chip"
									data-value=""
								>
									{NO_VERDICTS_TEXT}
								</Badge>
							)}
						</div>
					))
				) : (
					<span className={SCOPE_ROW_EMPTY_CLASS}>
						Not kept: not matched on
					</span>
				)}
			</div>
			<div className="flex items-center">
				{kept ? (
					<IconButton
						name="Bin"
						size={14}
						helpMessage="Clear verdicts"
						onClick={() => onChange(false)}
						className="!h-[22px] !w-[22px] hover:text-text-unexpected hover:bg-bg-fillError/60"
					/>
				) : (
					<IconButton
						name="Refresh"
						size={14}
						helpMessage="Restore verdicts"
						onClick={() => onChange(true)}
						// Mirrored as the section's reset-to-default arrow is.
						className="!h-[22px] !w-[22px] -scale-x-100"
					/>
				)}
			</div>
		</div>
	);
}
