/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { NetPacketAnalyzerPage } from '../../../pages/net-packet-analyzer';
import { packetViewerSearch } from '../../-search/packet-viewer.search';

export const Route = createFileRoute('/_app/tools/packet-viewer')({
	validateSearch: packetViewerSearch.validateSearch,
	search: { middlewares: packetViewerSearch.middlewares },
	component: NetPacketAnalyzerPage
});
