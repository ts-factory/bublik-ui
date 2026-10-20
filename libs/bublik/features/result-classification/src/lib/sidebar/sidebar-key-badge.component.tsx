/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	Badge,
	BadgeVariants,
	Tooltip,
	cn,
	useSidebar
} from '@/shared/tailwind-ui';

import { CLASSIFICATION_BADGE_CLASS } from '../classification/classification.constants';

/** Names the run beside its number: the entry itself only says "Run" or "Log". */
export function runKeyTooltip(runId: string, runName: string): string {
	return runName ? `Run #${runId}: ${runName}` : `Run #${runId}`;
}

export interface SidebarKeyBadgeProps {
	/** The entity's key or number, as drawn: `E2E-146`, `#1234`. */
	label: string;
	/** Names the entity: the entry itself only says "Issue" or "Run". */
	tooltip: string;
	/** Struck through and faded, for an entity that is done with. */
	closed?: boolean;
	testId: string;
}

/**
 * The active entity's key at the right edge of a top-level sidebar entry, in
 * the key chip's mono face. It renders inside the entry's link, so a click on
 * it follows the entry: the key is a label, not a second destination. Faded
 * out, like the counts, when the sidebar is collapsed.
 */
export function SidebarKeyBadge({
	label,
	tooltip,
	closed = false,
	testId
}: SidebarKeyBadgeProps) {
	const { isSidebarOpen } = useSidebar();

	return (
		<Tooltip content={tooltip} side="right">
			<Badge
				as="span"
				variant={BadgeVariants.Neutral}
				// Sized like the count badges, with the faint outline they take on
				// the current item kept on always: the entry is highlighted whenever
				// one of its pages is open, and the key must hold up on it either
				// way. `ml-auto` pushes it to the edge, just left of the chevron.
				// `min-w-0` lets it truncate when the row runs short, as it does
				// once the sidebar grows a scrollbar: the entry's name keeps its
				// width, and a badge that could not shrink would ride over the
				// chevron instead, taking its right margin with it.
				className={cn(
					CLASSIFICATION_BADGE_CLASS,
					'ml-auto mr-1.5 self-center min-w-0 block py-0 px-1.5 leading-4',
					'max-w-[9rem] truncate normal-case tracking-normal font-mono',
					'border-text-menu/15 transition-opacity',
					closed && 'line-through opacity-60',
					!isSidebarOpen && 'opacity-0'
				)}
				data-testid={testId}
				data-key-state={closed ? 'closed' : undefined}
			>
				{label}
			</Badge>
		</Tooltip>
	);
}
