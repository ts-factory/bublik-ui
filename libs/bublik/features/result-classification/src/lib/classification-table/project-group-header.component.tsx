/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';

import { Tooltip } from '@/shared/tailwind-ui';

export interface ProjectGroupHeaderProps {
	name: string;
	count: number;
	/** What the rows are: "issue" or "rule". */
	noun: string;
	/** The create button for this project, rendered at the right edge. */
	children?: ReactNode;
}

/**
 * The heading of one project's section when the table shows every project:
 * the name, how many of this page's rows it owns, and the button that creates
 * a new row in it — so the create action always sits next to the project it
 * acts on, not up in a toolbar that would have to guess.
 */
export function ProjectGroupHeader({
	name,
	count,
	noun,
	children
}: ProjectGroupHeaderProps) {
	const plural = count === 1 ? noun : `${noun}s`;

	return (
		<>
			<span className="truncate ml-2" data-testid="project-group-name">
				{name}
			</span>
			<Tooltip
				content={`${count} ${plural} from this project on this page. The page is cut by the sort order, not by project, so the project may continue on the next one.`}
			>
				<span className="font-medium tabular-nums text-text-menu">
					{count} {plural}
				</span>
			</Tooltip>
			{children ? (
				// The heading itself folds the group; a click on its button must not.
				<div className="ml-auto" onClick={(event) => event.stopPropagation()}>
					{children}
				</div>
			) : null}
		</>
	);
}
