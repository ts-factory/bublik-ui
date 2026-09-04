/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { Row } from '@tanstack/react-table';

import { ButtonTw, Icon, Tooltip, cn } from '@/shared/tailwind-ui';
import type { RunIssueRow } from '@/shared/types';

export interface ResultsToggleProps {
	row: Row<RunIssueRow>;
}

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
