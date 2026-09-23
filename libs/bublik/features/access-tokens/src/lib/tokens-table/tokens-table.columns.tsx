/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';

import { AccessToken } from '@/shared/types';
import { CopyTooltip, Tooltip } from '@/shared/tailwind-ui';

import { AccessTokenStatusBadge } from '../status-badge';
import { RevokeTokenContainer } from '../revoke-token';

const helper = createColumnHelper<AccessToken>();

/** Timestamps are shown to the minute, which is all the API records. */
const MINUTE_FORMAT = 'yyyy.MM.dd / HH:mm';

const formatMinute = (value: string | null) =>
	value ? format(new Date(value), MINUTE_FORMAT) : null;

const nameColumn = helper.accessor('name', {
	id: 'name',
	header: 'Name',
	cell: (cell) => <span className="font-semibold">{cell.getValue()}</span>
});

/**
 * The handle: the only part of a token that stays visible, so a user can tell
 * which token a client is configured with without ever seeing the secret.
 */
const prefixColumn = helper.accessor('prefix', {
	id: 'prefix',
	header: 'Handle',
	cell: (cell) => (
		<CopyTooltip copyString={cell.getValue()}>
			<span className="font-mono text-xs text-text-menu">
				{cell.getValue()}…
			</span>
		</CopyTooltip>
	)
});

const statusColumn = helper.accessor('status', {
	id: 'status',
	header: 'Status',
	cell: (cell) => <AccessTokenStatusBadge status={cell.getValue()} />
});

const lastUsedColumn = helper.accessor('last_used_at', {
	id: 'last_used_at',
	header: 'Last used',
	cell: (cell) => {
		const formatted = formatMinute(cell.getValue());

		if (!formatted) {
			return <span className="text-text-menu">Never used</span>;
		}

		return <span>{formatted}</span>;
	}
});

const expiresColumn = helper.accessor('expires_at', {
	id: 'expires_at',
	header: 'Expires',
	cell: (cell) => {
		const formatted = formatMinute(cell.getValue());

		if (!formatted) return <span className="text-text-menu">Never</span>;

		return <span>{formatted}</span>;
	}
});

const createdColumn = helper.accessor('created', {
	id: 'created',
	header: 'Created',
	cell: (cell) => <span>{formatMinute(cell.getValue())}</span>
});

const ownerColumn = helper.accessor('owner', {
	id: 'owner',
	header: 'Owner',
	cell: (cell) => (
		<a
			href={`mailto:${cell.getValue()}`}
			className="hover:underline text-primary"
		>
			{cell.getValue()}
		</a>
	)
});

const actionsColumn = helper.display({
	id: 'actions',
	header: '',
	cell: (cell) => {
		const token = cell.row.original;

		if (token.status === 'revoked') {
			return token.revoked_by ? (
				<Tooltip content={`Revoked by ${token.revoked_by}`}>
					<span className="text-xs text-text-menu">by {token.revoked_by}</span>
				</Tooltip>
			) : null;
		}

		return <RevokeTokenContainer id={token.id} name={token.name} />;
	}
});

export const columns = [
	actionsColumn,
	nameColumn,
	prefixColumn,
	statusColumn,
	lastUsedColumn,
	expiresColumn,
	createdColumn
];

/** The admin view adds the owner, since it spans every user. */
export const adminColumns = [
	actionsColumn,
	ownerColumn,
	nameColumn,
	prefixColumn,
	statusColumn,
	lastUsedColumn,
	expiresColumn,
	createdColumn
];
