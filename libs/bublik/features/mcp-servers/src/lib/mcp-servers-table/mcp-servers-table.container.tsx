/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { useGetMcpServersQuery } from '@/services/bublik-api';

import {
	McpServersTable,
	McpServersTableEmpty,
	McpServersTableError,
	McpServersTableLoading
} from './mcp-servers-table.component';

export const McpServersTableContainer = () => {
	const { data, isLoading, error } = useGetMcpServersQuery();

	if (error) return <McpServersTableError error={error} />;
	if (isLoading) return <McpServersTableLoading />;
	if (!data?.length) return <McpServersTableEmpty />;

	return <McpServersTable servers={data} />;
};
