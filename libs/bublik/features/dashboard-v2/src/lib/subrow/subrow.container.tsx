/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren } from 'react';
import { Row } from '@tanstack/react-table';

import { DashboardData } from '@/shared/types';
import { cn, getRunStatusInfo } from '@/shared/tailwind-ui';

import { RunProgressContainer } from '../run-progress';

/**
 * Which table the subrow sits in. The grid table positions the subrow
 * against its own box; the legacy flex table wraps row and subrow in one
 * positioned box, so the strip starts at the row's top already.
 */
export type SubrowVariant = 'grid' | 'legacy';

const stripStyles: Record<SubrowVariant, string> = {
	// Continues the status icon down the subrow, over the row border. It
	// starts a row height (h-9) above, behind the icon, so the icon's rounded
	// bottom corner has colour behind it instead of a notch.
	grid: '-top-9 h-[calc(100%+2.25rem+1px)]',
	legacy: 'top-0 h-[calc(100%+1px)]'
};

interface SubrowProps {
	row: Row<DashboardData>;
	variant?: SubrowVariant;
}

export const Subrow = ({
	row,
	variant = 'grid',
	children
}: PropsWithChildren<SubrowProps>) => {
	const { bg, color } = getRunStatusInfo(row.original.context.conclusion);

	return (
		<>
			<div
				className={cn(
					'w-6 shrink-0 rounded-l-md absolute -left-px',
					stripStyles[variant],
					color,
					bg
				)}
			/>
			<div
				data-testid="dashboard-row-subrow"
				data-run-id={row.original.context.run_id}
				className="flex flex-col gap-4 py-2 pl-8 pr-2 bg-bg-primary rounded-b-md"
			>
				{children}
			</div>
		</>
	);
};

export const renderSubrow = (row: Row<DashboardData>) => (
	<Subrow row={row}>
		<RunProgressContainer runId={row.original.context.run_id} />
	</Subrow>
);

export const renderLegacySubrow = (row: Row<DashboardData>) => (
	<Subrow row={row} variant="legacy">
		<RunProgressContainer runId={row.original.context.run_id} />
	</Subrow>
);
