/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CSSProperties } from 'react';
import { ColumnDef, RowData } from '@tanstack/react-table';

import { DashboardAPIResponse, DashboardData } from '@/shared/types';
import { cn } from '@/shared/tailwind-ui';

import {
	CellList,
	CellLink,
	RunIcon,
	CellProgress,
	CellText
} from './components';
import {
	columnHasBadges,
	createColorMap,
	getColumnTracks,
	isNumericColumn
} from './dashboard-table.component.utils';

import { ExpandButtonContainer } from '../expand-button';
import { CellNotesContainer } from '../cell-notes';

export type DashboardColumnAlign = 'left' | 'right';

/** 24px icon plus the row's 1px left border, which the icon covers. */
const STATUS_COLUMN_WIDTH = 25;
const EXPAND_COLUMN_WIDTH = 32;

declare module '@tanstack/react-table' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData extends RowData, TValue> {
		/** Inline flex sizing, used by the legacy table only. */
		style?: CSSProperties;
		/** Track size for the table's `grid-template-columns`. */
		width?: string;
		/** Cells may shrink below their content and truncate. */
		shrinks?: boolean;
		align?: DashboardColumnAlign;
		/**
		 * The column has badge cells, whose text is inset by the badge padding.
		 * In a left-aligned column the header and plain-text cells take the same
		 * inset so the text lines up. Right-aligned badges keep their edge on the
		 * header's edge instead, which reads better for numbers.
		 */
		hasBadges?: boolean;
		/**
		 * The previous column is right-aligned, so without extra room its
		 * content would end where this column's text starts.
		 */
		gapBefore?: boolean;
		/** Fixed icon track: no horizontal padding, cell is a positioning root. */
		isIcon?: boolean;
	}
}

export interface CreateColumnsOptions {
	/** Render the trailing expand column. Off in TV mode, where nothing is clickable. */
	showExpand?: boolean;
}

export const createColumns = (
	headers: DashboardAPIResponse['header'],
	rows: DashboardAPIResponse['rows'],
	date: Date,
	payload: DashboardAPIResponse['payload'],
	{ showExpand = true }: CreateColumnsOptions = {}
): ColumnDef<DashboardData>[] => {
	const map = createColorMap(rows, headers);
	const tracks = getColumnTracks(rows, headers);

	const aligns = headers.map(
		({ key }): DashboardColumnAlign =>
			isNumericColumn(rows, key) ? 'right' : 'left'
	);

	const mainColumns = headers.map(({ name, key }, idx) => {
		const align = aligns[idx];
		const hasBadges = columnHasBadges(rows, key);
		const gapBefore = align === 'left' && aligns[idx - 1] === 'right';

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

				return (
					<CellText
						value={value}
						className={cn(hasBadges && align === 'left' && 'px-2')}
					/>
				);
			},
			meta: {
				width: tracks.get(key)?.track,
				shrinks: tracks.get(key)?.shrinks,
				align,
				hasBadges,
				gapBefore
			}
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
		meta: { width: `${STATUS_COLUMN_WIDTH}px`, isIcon: true }
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
		meta: { width: `${EXPAND_COLUMN_WIDTH}px`, isIcon: true }
	};

	return showExpand
		? [statusColumn, ...mainColumns, expandColumn]
		: [statusColumn, ...mainColumns];
};
