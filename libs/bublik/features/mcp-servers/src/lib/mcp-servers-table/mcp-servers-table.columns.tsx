/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';

import { McpServer } from '@/shared/types';
import { Tooltip } from '@/shared/tailwind-ui';

import { DeleteMcpServerContainer } from '../delete-mcp-server';
import { EditMcpServerContainer } from '../mcp-server-form';
import { ToggleMcpServerContainer } from '../toggle-mcp-server';

const helper = createColumnHelper<McpServer>();

const MINUTE_FORMAT = 'yyyy.MM.dd / HH:mm';

const actionsColumn = helper.display({
	id: 'actions',
	header: '',
	cell: (cell) => {
		const server = cell.row.original;

		return (
			<div className="flex items-center gap-2">
				<EditMcpServerContainer server={server} />
				<DeleteMcpServerContainer id={server.id} name={server.name} />
			</div>
		);
	}
});

const nameColumn = helper.accessor('name', {
	id: 'name',
	header: 'Name',
	cell: (cell) => (
		<div className="flex flex-col">
			<span className="font-semibold">{cell.getValue()}</span>
			<Tooltip content="Tools from this server are named with this prefix">
				<span className="font-mono text-xs text-text-menu">
					{cell.row.original.slug}_*
				</span>
			</Tooltip>
		</div>
	)
});

const urlColumn = helper.accessor('url', {
	id: 'url',
	header: 'URL',
	cell: (cell) => (
		<span
			className="block max-w-[280px] font-mono text-xs truncate text-text-menu"
			title={cell.getValue()}
		>
			{cell.getValue()}
		</span>
	)
});

/** Only the names: the values are write-only on the server. */
const headersColumn = helper.accessor('header_names', {
	id: 'header_names',
	header: 'Headers',
	enableSorting: false,
	cell: (cell) => {
		const names = cell.getValue();

		if (!names.length) return <span className="text-text-menu">None</span>;

		return (
			<div className="flex flex-wrap gap-1">
				{names.map((name) => (
					<span
						key={name}
						className="rounded-md border border-border-primary bg-slate-1 px-1.5 py-0.5 font-mono text-xs"
					>
						{name}
					</span>
				))}
			</div>
		);
	}
});

const enabledColumn = helper.accessor('enabled', {
	id: 'enabled',
	header: 'Status',
	cell: (cell) => <ToggleMcpServerContainer server={cell.row.original} />
});

const updatedColumn = helper.accessor('updated', {
	id: 'updated',
	header: 'Updated',
	cell: (cell) => (
		<span>{format(new Date(cell.getValue()), MINUTE_FORMAT)}</span>
	)
});

export const columns = [
	actionsColumn,
	nameColumn,
	urlColumn,
	headersColumn,
	enabledColumn,
	updatedColumn
];
