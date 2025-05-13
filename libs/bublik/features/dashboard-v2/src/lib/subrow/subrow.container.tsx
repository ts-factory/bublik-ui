/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren } from 'react';
import { Row } from '@tanstack/react-table';
import { z } from 'zod';

import { DashboardData } from '@/shared/types';
import { cn, getRunStatusInfo } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';

import { createColorMap } from '../dashboard-table/dashboard-table.component.utils';
import { RunProgressContainer } from '../run-progress';
import { getUrl } from '../utils';
import { linkStyles } from '../dashboard-table/components';

interface SubrowProps {
	row: Row<DashboardData>;
	context: Record<string, string>;
}

export const Subrow = ({
	row,
	context,
	children
}: PropsWithChildren<SubrowProps>) => {
	const { bg, color } = getRunStatusInfo(row.original.context.conclusion);
	const colorMap = createColorMap(row.original);

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
				<ul className="flex flex-wrap gap-2">
					{Object.entries(row.original.row_cells)
						.filter(([, cell]) => !Array.isArray(cell) && cell.payload)
						.map(([key, cell]) => {
							const className = cn(linkStyles(), colorMap.getColorByKey(key));

							if (Array.isArray(cell)) return null;
							if (!cell.payload?.url) return null;

							if (z.string().url().safeParse(cell.payload.url).success) {
								return (
									<a
										key={key}
										href={cell.payload.url}
										target="_blank"
										rel="noopener noreferrer"
										className={className}
									>
										{cell.value} - {context[key]}
									</a>
								);
							}

							const to = getUrl(cell.payload.url, row.original.context.run_id);

							return (
								<LinkWithProject key={key} to={to} className={className}>
									{cell.value} - {context[key]}
								</LinkWithProject>
							);
						})}
				</ul>
				{children}
			</div>
		</>
	);
};

export const renderSubrow = (
	row: Row<DashboardData>,
	context: Record<string, string>
) => (
	<Subrow row={row} context={context}>
		<RunProgressContainer runId={row.original.context.run_id} />
	</Subrow>
);
