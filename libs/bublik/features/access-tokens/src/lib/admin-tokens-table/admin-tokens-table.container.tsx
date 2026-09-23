/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { useAdminGetAccessTokensQuery } from '@/services/bublik-api';

import {
	TokensTable,
	TokensTableEmpty,
	TokensTableError,
	TokensTableLoading
} from '../tokens-table/tokens-table.component';

/**
 * Rendered only under the admin ProtectedRoute; the endpoint's
 * @auth_required(as_admin=True) is the real boundary.
 */
export const AdminTokensTableContainer = () => {
	const { data, isLoading, error } = useAdminGetAccessTokensQuery();

	if (error) return <TokensTableError error={error} />;
	if (isLoading) return <TokensTableLoading />;
	if (!data?.length) return <TokensTableEmpty />;

	return <TokensTable tokens={data} withOwner />;
};
