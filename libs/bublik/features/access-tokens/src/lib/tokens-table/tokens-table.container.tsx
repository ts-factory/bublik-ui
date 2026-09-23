/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { useGetAccessTokensQuery } from '@/services/bublik-api';

import {
	TokensTable,
	TokensTableEmpty,
	TokensTableError,
	TokensTableLoading
} from './tokens-table.component';

export const TokensTableContainer = () => {
	const { data, isLoading, error } = useGetAccessTokensQuery();

	if (error) return <TokensTableError error={error} />;
	if (isLoading) return <TokensTableLoading />;
	if (!data?.length) return <TokensTableEmpty />;

	return <TokensTable tokens={data} />;
};
