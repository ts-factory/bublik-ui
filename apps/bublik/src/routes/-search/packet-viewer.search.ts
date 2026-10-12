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
 * `/tools/packet-viewer`. `fileUrl` must be a URL and the ids
 * numbers; a value that is not stays on the URL as its raw string
 * (`keepRaw`), so the page renders its own "invalid
 * parameters" state for it, with the same validation errors, rather than
 * the router's error component, and keeps reporting it after the sidebar
 * writes `_s`.
 */
const packetViewerSearch = defineSearch({
	fileUrl: keepRaw(validated(str(), z.string().url())),
	runId: keepRaw(num()),
	resultId: keepRaw(num())
});

type PacketViewerSearch = InferSearch<typeof packetViewerSearch>;

export { packetViewerSearch };
export type { PacketViewerSearch };
