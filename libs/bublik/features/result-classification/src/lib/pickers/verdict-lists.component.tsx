/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	Badge,
	BadgeVariants,
	FLOATING_LABEL_BACKDROP_CLASS,
	Icon,
	IconButton,
	InputLabel,
	Tooltip,
	cn
} from '@/shared/tailwind-ui';

import { NO_VERDICTS_TEXT } from '../rule-form/matcher-fields.utils';
import { comboboxInputStyles } from './pickers.styles';

export interface VerdictListsProps {
	/** What a rule does with the verdicts, shown on the label. */
	hint: string;
	/** The verdict lists the test's results failed with, a rule each. */
	lists: readonly (readonly string[])[];
	kept: boolean;
	onChange: (kept: boolean) => void;
	testId?: string;
}

/**
 * The Verdicts field of a test's match scope. The server matches verdicts
 * exactly, so there is nothing to pick from: the rules keep every list the
 * results failed with, one rule per list, or match on no verdict at all. The
 * field shows the lists as the pickers show their chips, with the bin to
 * drop them; dropped, it greys out like an emptied picker, and the bin's
 * place takes a Restore pill, styled as History's verdict lookup toggles.
 */
export function VerdictLists({
	hint,
	lists,
	kept,
	onChange,
	testId
}: VerdictListsProps) {
	const several = lists.length > 1;

	return (
		<div className="relative" data-testid={testId} data-kept={kept}>
			<Tooltip content={hint}>
				<InputLabel
					className={cn(
						'absolute top-[-11px] left-2 z-10',
						FLOATING_LABEL_BACKDROP_CLASS
					)}
				>
					Verdicts
				</InputLabel>
			</Tooltip>
			{/* The bin sits on white padding, as the pickers' bins do; the pill
			    brings its own box, and padding would bleed white past it. */}
			<div
				className={cn(
					'absolute -top-3 right-[9px] z-10 flex items-center bg-bg-primary',
					kept && 'px-1'
				)}
			>
				{kept ? (
					<IconButton
						name="Bin"
						size={14}
						helpMessage="Clear verdicts"
						onClick={() => onChange(false)}
						className="!h-[22px] !w-[22px] hover:text-text-unexpected hover:bg-bg-fillError/60"
					/>
				) : (
					// The History verdict input's STRING / REGEX toggles: a pill in a
					// bordered box on the border, so the greyed field still shows
					// where it is switched back on.
					<div className="inline-flex items-center rounded border border-border-input bg-bg-primary p-0.5">
						<button
							type="button"
							aria-label="Restore verdicts"
							onClick={() => onChange(true)}
							className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.02em] leading-[0.75rem] text-text-menu transition-colors hover:bg-primary-wash hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
						>
							{/* Mirrored as the section's reset-to-default arrow is. */}
							<Icon name="Refresh" size={12} className="-scale-x-100" />
							Restore
						</button>
					</div>
				)}
			</div>
			<div
				className={cn(
					comboboxInputStyles(),
					'flex min-h-[40px] flex-col justify-center gap-1.5 py-2',
					!kept && 'bg-bg-body'
				)}
			>
				{kept ? (
					lists.map((list, index) => (
						<div
							key={list.join('\u0000')}
							className="flex flex-wrap items-center gap-1.5"
							data-testid="match-scope-verdict-list"
						>
							{several ? (
								<span className="w-11 shrink-0 text-[0.6875rem] uppercase tracking-wider text-text-menu">
									Rule {index + 1}
								</span>
							) : null}
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
					<span className="text-[0.875rem] text-text-menu">
						Not kept: not matched on
					</span>
				)}
			</div>
		</div>
	);
}
