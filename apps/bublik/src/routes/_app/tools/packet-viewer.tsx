/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { NetPacketAnalyzerPage } from '../../../pages/net-packet-analyzer';

export const Route = createFileRoute('/_app/tools/packet-viewer')({
	component: NetPacketAnalyzerPage
});
