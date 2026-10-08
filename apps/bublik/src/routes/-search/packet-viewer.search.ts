/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { z } from 'zod';

import {
	defineSearch,
	keepRaw,
	num,
	str,
	validated,
	type InferSearch
} from '@/router';

/**
 * `/tools/packet-viewer`. `fileUrl` must be a URL; one that is
 * not reads as absent so the page renders its own "invalid parameters"
 * state rather than the router's error component. The ids are numbers; one
 * that is not stays on the URL as its raw string (`keepRaw`),
 * so the page keeps reporting it as invalid after the sidebar writes `_s`.
 */
const packetViewerSearch = defineSearch({
	fileUrl: validated(str(), z.string().url()),
	runId: keepRaw(num()),
	resultId: keepRaw(num())
});

type PacketViewerSearch = InferSearch<typeof packetViewerSearch>;

export { packetViewerSearch };
export type { PacketViewerSearch };
