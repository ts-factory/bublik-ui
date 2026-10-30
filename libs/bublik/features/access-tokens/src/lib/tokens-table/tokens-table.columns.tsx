/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { createColumnHelper } from '@tanstack/react-table';

import { AccessToken } from '@/shared/types';
import { CopyTooltip, Tooltip } from '@/shared/tailwind-ui';
import { ISSUE_ACTIONS_COLUMN_META } from '@/bublik/features/result-classification';

import { AccessTokenStatusBadge } from '../status-badge';
import { RevokeTokenContainer } from '../revoke-token';
import { formatMinute, formatMinuteWithZone } from '../utils/token-dates';

const helper = createColumnHelper<AccessToken>();

const DATE_COLUMN_META = { width: 'auto' } as const;

const nameColumn = helper.accessor('name', {
	id: 'name',
	header: 'Name',
	meta: { width: 'minmax(8rem, max-content)' },
	cell: (cell) => <span className="break-words">{cell.getValue()}</span>
});

/**
 * The handle: the only part of a token that stays visible, so a user can tell
 * which token a client is configured with without ever seeing the secret.
 */
const prefixColumn = helper.accessor('prefix', {
	id: 'prefix',
	header: 'Handle',
	meta: { width: 'auto' },
	cell: (cell) => (
		<CopyTooltip copyString={cell.getValue()}>
			<span className="font-mono text-text-menu">{cell.getValue()}…</span>
		</CopyTooltip>
	)
});

const statusColumn = helper.accessor('status', {
	id: 'status',
	header: 'Status',
	meta: { width: 'auto', badgeCell: true },
	cell: (cell) => {
		const token = cell.row.original;
		const badge = <AccessTokenStatusBadge status={cell.getValue()} />;

		if (token.status !== 'revoked' || !token.revoked_by) return badge;

		return (
			<Tooltip content={`Revoked by ${token.revoked_by}`}>
				<span>{badge}</span>
			</Tooltip>
		);
	}
});

const lastUsedColumn = helper.accessor('last_used_at', {
	id: 'last_used_at',
	header: 'Last Used',
	meta: DATE_COLUMN_META,
	cell: (cell) => {
		const formatted = formatMinute(cell.getValue());

		if (!formatted) {
			return <span className="text-text-menu">Never used</span>;
		}

		return <span className="tabular-nums">{formatted}</span>;
	}
});

const expiresColumn = helper.accessor('expires_at', {
	id: 'expires_at',
	header: 'Expires',
	meta: DATE_COLUMN_META,
	cell: (cell) => {
		const formatted = formatMinuteWithZone(cell.getValue());

		if (!formatted) return <span className="text-text-menu">Never</span>;

		return <span className="tabular-nums">{formatted}</span>;
	}
});

const createdColumn = helper.accessor('created', {
	id: 'created',
	header: 'Created',
	meta: DATE_COLUMN_META,
	cell: (cell) => (
		<span className="tabular-nums">
			{formatMinuteWithZone(cell.getValue())}
		</span>
	)
});

const ownerColumn = helper.accessor('owner', {
	id: 'owner',
	header: 'Owner',
	meta: { width: 'minmax(10rem, max-content)' },
	cell: (cell) => (
		<a
			href={`mailto:${cell.getValue()}`}
			className="hover:underline text-primary"
		>
			{cell.getValue()}
		</a>
	)
});

/** Revoked tokens have nothing left to act on; their status says who did it. */
const actionsColumn = helper.display({
	id: 'actions',
	header: 'Actions',
	meta: {
		...ISSUE_ACTIONS_COLUMN_META,
		// As tall as a cell holding the Revoke button, so revoking a token does
		// not shrink its row by the 2px the button stood above the badges.
		cellClassName: `${ISSUE_ACTIONS_COLUMN_META.cellClassName} min-h-9`
	},
	cell: (cell) => {
		const token = cell.row.original;

		if (token.status === 'revoked') return null;

		return (
			<div className="flex items-center gap-1 w-fit">
				<RevokeTokenContainer id={token.id} name={token.name} />
			</div>
		);
	}
});

export const PINNED_LAST_COLUMNS = ['actions'] as const;

/** Spans every user, so each token names the account it acts as. */
export const columns = [
	ownerColumn,
	nameColumn,
	prefixColumn,
	statusColumn,
	lastUsedColumn,
	expiresColumn,
	createdColumn,
	actionsColumn
];
