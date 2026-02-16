/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren } from 'react';
import { Row } from '@tanstack/react-table';

import { DashboardData } from '@/shared/types';
import { cn, getRunStatusInfo } from '@/shared/tailwind-ui';

import { RunProgressContainer } from '../run-progress';

interface SubrowProps {
	row: Row<DashboardData>;
}

export const Subrow = ({ row, children }: PropsWithChildren<SubrowProps>) => {
	const { bg, color } = getRunStatusInfo(row.original.context.conclusion);

	return (
		<>
			<div
				className={cn(
					'w-6 shrink-0 rounded-l-md absolute -left-px top-0 h-[calc(100%+1px)]',
					color,
					bg
				)}
			/>
			<div className="flex flex-col gap-4 py-2 pl-8 pr-2 bg-white rounded-b-md">
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
