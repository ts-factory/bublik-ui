/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { Row } from '@tanstack/react-table';

import { ButtonTw, Icon, Tooltip, cn } from '@/shared/tailwind-ui';
import type { RunIssueRow } from '@/shared/types';

export interface ResultsToggleProps {
	row: Row<RunIssueRow>;
}

/**
 * Opens the results this issue is stamped on within the run.
 *
 * The result count further along the row toggles the same thing — that one is
 * for when you are reading the number and want to see what is behind it, this
 * one is for when you are working down the Actions column.
 *
 * Labelled `Results` rather than `Show Results`/`Hide Results`. The buttons in
 * this stack share one edge, so the longest label sets the width of the whole
 * column — and a label that changes on click was resizing the column under the
 * cursor. The chevron carries the open/closed state, `aria-expanded` carries it
 * for screen readers, and the tooltip says which way it will go.
 */
export function ResultsToggle({ row }: ResultsToggleProps) {
	const isExpanded = row.getIsExpanded();

	return (
		<Tooltip
			content={
				isExpanded
					? 'Hide the results this issue is stamped on'
					: 'Show the results this issue is stamped on in this run'
			}
		>
			<ButtonTw
				variant="secondary"
				size="xss"
				onClick={row.getToggleExpandedHandler()}
				aria-expanded={isExpanded}
				className="justify-start whitespace-nowrap"
				data-testid="run-issue-expander"
			>
				<Icon
					name="ArrowShortSmall"
					size={14}
					className={cn(
						'mr-1 transition-transform',
						isExpanded ? 'rotate-0' : '-rotate-90'
					)}
				/>
				Results
			</ButtonTw>
		</Tooltip>
	);
}
