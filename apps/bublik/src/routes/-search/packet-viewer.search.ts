/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { z } from 'zod';

import { defineSearch, num, str, validated, type InferSearch } from '@/router';

/**
 * `/tools/packet-viewer`. `fileUrl` must be a URL; one that is
 * not reads as absent so the page renders its own "invalid parameters"
 * state rather than the router's error component. The ids are numbers.
 */
const packetViewerSearch = defineSearch({
	fileUrl: validated(str(), z.string().url()),
	runId: num(),
	resultId: num()
});

type PacketViewerSearch = InferSearch<typeof packetViewerSearch>;

export { packetViewerSearch };
export type { PacketViewerSearch };
