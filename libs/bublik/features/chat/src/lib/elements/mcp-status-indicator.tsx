/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useState } from 'react';
import { PlugIcon, RefreshCwIcon } from 'lucide-react';

import type { McpServerStatus, McpStatusResponse } from '@/services/bublik-api';
import {
	ButtonTw,
	Icon,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	cn
} from '@/shared/tailwind-ui';

const STATUS_LABEL: Record<McpServerStatus['status'], string> = {
	connected: 'Connected',
	unavailable: 'Unavailable',
	disabled: 'Disabled',
	misconfigured: 'Misconfigured',
	collision: 'Name taken by a global server'
};

const DOT_COLOR: Record<McpServerStatus['status'], string> = {
	connected: 'bg-green-500',
	unavailable: 'bg-red-500',
	disabled: 'bg-slate-400',
	misconfigured: 'bg-amber-500',
	collision: 'bg-amber-500'
};

function StatusDot({ status }: { status: McpServerStatus['status'] }) {
	return (
		<span
			className={cn(
				'inline-block size-2 rounded-full shrink-0',
				DOT_COLOR[status]
			)}
			aria-hidden
		/>
	);
}

function ServerRow({ server }: { server: McpServerStatus }) {
	const detail =
		server.status === 'connected'
			? `${server.tools ?? 0} ${server.tools === 1 ? 'tool' : 'tools'}`
			: STATUS_LABEL[server.status];

	return (
		<li
			className="flex items-center gap-2 px-3 py-1.5 text-xs"
			title={server.error ?? undefined}
		>
			<StatusDot status={server.status} />
			<span className="font-medium text-text-primary truncate">
				{server.name}
			</span>
			<span className="ml-auto text-text-secondary whitespace-nowrap">
				{detail}
			</span>
		</li>
	);
}

function Group({
	title,
	servers
}: {
	title: string;
	servers: McpServerStatus[];
}) {
	const active = servers.filter((s) => s.status !== 'disabled');
	const connected = active.filter((s) => s.status === 'connected').length;

	return (
		<div className="border-t border-border-primary first:border-t-0">
			<div className="flex items-center h-9 px-3 text-[0.6875rem] font-semibold uppercase tracking-wide text-text-secondary">
				{title}
				<span className="ml-auto font-normal normal-case tracking-normal">
					{servers.length === 1 ? '1 server' : `${servers.length} servers`}
					{active.length ? ` · ${connected}/${active.length} connected` : ''}
				</span>
			</div>
			{servers.length ? (
				<ul className="pb-1">
					{servers.map((server) => (
						<ServerRow key={`${server.scope}:${server.id}`} server={server} />
					))}
				</ul>
			) : (
				<p className="px-3 pb-2 text-xs text-text-menu">None</p>
			)}
		</div>
	);
}

/**
 * Composer-toolbar summary of the MCP servers the next message can use, split
 * into the administrator's servers and the user's own, each with a live
 * connection status. Probing opens the connections, so it happens on demand.
 */
export function McpStatusIndicator({
	status,
	isFetching,
	onRefresh,
	onManage
}: {
	status: McpStatusResponse | undefined;
	isFetching: boolean;
	onRefresh: () => void;
	onManage?: () => void;
}) {
	const [open, setOpen] = useState(false);

	const all = status ? [...status.global, ...status.user] : [];
	const active = all.filter((s) => s.status !== 'disabled');

	if (!status || (!all.length && !onManage)) return null;

	const connected = active.filter((s) => s.status === 'connected').length;
	const summary: McpServerStatus['status'] = !active.length
		? 'disabled'
		: connected === active.length
		? 'connected'
		: connected === 0
		? 'unavailable'
		: 'misconfigured';
	const label = active.length
		? `${connected}/${active.length} MCP`
		: 'No MCP servers';

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<Tooltip content="MCP servers available to the assistant">
				<PopoverTrigger asChild>
					<ButtonTw
						size="xs"
						variant="outline-secondary"
						state={open ? 'active' : 'default'}
						aria-label="MCP servers"
					>
						<PlugIcon className="size-3.5 mr-1.5" />
						<StatusDot status={summary} />
						<span className="ml-1.5">{label}</span>
					</ButtonTw>
				</PopoverTrigger>
			</Tooltip>
			<PopoverContent
				align="start"
				className="w-80 rounded-lg p-0 bg-white shadow-popover"
				sideOffset={4}
			>
				<Group title="Global" servers={status.global} />
				<Group title="Yours" servers={status.user} />
				<div className="flex items-center gap-2 border-t border-border-primary p-2">
					<ButtonTw
						size="xss"
						variant="outline"
						onClick={onRefresh}
						disabled={isFetching}
						aria-label="Refresh MCP status"
					>
						<RefreshCwIcon
							className={cn('size-3 mr-1', isFetching && 'animate-spin')}
						/>
						Refresh
					</ButtonTw>
					{onManage ? (
						<ButtonTw
							size="xss"
							variant="outline"
							className="ml-auto"
							onClick={() => {
								setOpen(false);
								onManage();
							}}
						>
							Manage
							<Icon name="ArrowShortSmall" className="ml-1 -rotate-90" />
						</ButtonTw>
					) : null}
				</div>
			</PopoverContent>
		</Popover>
	);
}
