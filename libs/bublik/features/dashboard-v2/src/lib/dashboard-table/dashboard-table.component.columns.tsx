/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CSSProperties } from 'react';
import { ColumnDef, RowData } from '@tanstack/react-table';

import { DashboardAPIResponse, DashboardData } from '@/shared/types';

import {
	CellList,
	CellLink,
	RunIcon,
	CellProgress,
	CellText
} from './components';
import {
	createColorMap,
	getColumnWidth
} from './dashboard-table.component.utils';

import { ExpandButtonContainer } from '../expand-button';
import { CellNotesContainer } from '../cell-notes';

declare module '@tanstack/react-table' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData extends RowData, TValue> {
		style?: CSSProperties;
	}
}

export const createColumns = (
	headers: DashboardAPIResponse['header'],
	rows: DashboardAPIResponse['rows'],
	date: Date,
	payload: DashboardAPIResponse['payload']
): ColumnDef<DashboardData>[] => {
	const map = createColorMap(rows);

	const mainColumns = headers.map(({ name, key }, idx) => {
		const style = {
			flexGrow: getColumnWidth(rows, key, name),
			flexShrink: 1,
			flexBasis: '0%',
			minWidth: 0,
			paddingLeft: idx === 0 ? 4 : 1,
			paddingRight: idx === 0 ? 4 : 1
		} satisfies CSSProperties;

		const column: ColumnDef<DashboardData> = {
			id: key,
			header: () => <span className="truncate">{name}</span>,
			accessorFn: (data) => {
				const cell = data.row_cells[key];

				if (Array.isArray(cell)) {
					return cell.map((v) => v?.value).join(', ');
				}

				return cell?.value;
			},
			cell: (api) => {
				const cell = api.row.original.row_cells[key];
				const rowContext = api.row.original.context;
				const value = api.getValue<string | undefined>();

				if (Array.isArray(cell)) {
					return <CellList data={cell} />;
				}

				if (key === 'progress' && value) {
					return <CellProgress progress={Number(value.replace('%', ''))} />;
				}

				if (key === 'notes') {
					return <CellNotesContainer runId={rowContext.run_id} date={date} />;
				}

				if (cell?.payload) {
					return (
						<CellLink
							data={cell}
							cellKey={key}
							bgColor={map.getColorByKey(key)}
							hint={payload[key]}
						/>
					);
				}

				if (!value) return null;

				return <CellText value={value} />;
			},
			meta: { style }
		};

		return column;
	});

	const statusColumn: ColumnDef<DashboardData> = {
		id: 'status-col',
		header: () => null,
		cell: ({ row }) => (
			<RunIcon
				runStatus={row.original.context.conclusion}
				conclusionReason={row.original.context.conclusion_reason}
			/>
		),
		meta: { style: { width: 24, position: 'relative' } }
	};

	const expandColumn: ColumnDef<DashboardData> = {
		id: 'expand-col',
		header: () => null,
		cell: ({ row }) => {
			return (
				<ExpandButtonContainer
					runId={row.original.context.run_id}
					isExpanded={row.getIsExpanded()}
					onClick={() => row.toggleExpanded()}
				/>
			);
		},
		meta: { style: { paddingLeft: 4, paddingRight: 4, width: 32 } }
	};

	return [statusColumn, ...mainColumns, expandColumn];
};
