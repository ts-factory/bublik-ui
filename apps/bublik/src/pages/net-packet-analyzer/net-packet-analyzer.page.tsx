/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { getRouteApi } from '@tanstack/react-router';
import { z } from 'zod';

import { NetPacketAnalyserContainer } from '@/bublik/features/net-analysis';

const packetViewerRoute = getRouteApi('/_app/tools/packet-viewer');

/**
 * What the viewer needs, checked on the route's typed search:
 * a `fileUrl` that is not a URL and an id that is not a number stay their
 * raw strings (`keepRaw`), so they fail here and the page shows its own
 * "invalid parameters" panel. `coerce` keeps `runId=` reading
 * as 0, as it did on the raw query string.
 */
const SearchParamsSchema = z.object({
	fileUrl: z.string().url(),
	runId: z.coerce.number().optional(),
	resultId: z.coerce.number().optional()
});

function NetPacketAnalyzerPage() {
	const fileUrl = packetViewerRoute.useSearch({ select: (s) => s.fileUrl });
	const rawRunId = packetViewerRoute.useSearch({ select: (s) => s.runId });
	const rawResultId = packetViewerRoute.useSearch({
		select: (s) => s.resultId
	});
	const result = SearchParamsSchema.safeParse({
		fileUrl,
		runId: rawRunId,
		resultId: rawResultId
	});

	if (!result.success) {
		return (
			<div className="grid place-items-center h-full">
				<div className="p-4 border border-bg-error/50 bg-bg-fillError/40 rounded-md">
					<h2 className="text-text-unexpected font-semibold mb-2">
						Invalid URL Parameters
					</h2>
					<p className="text-text-unexpected mb-3">
						Required: fileUrl (valid URL), optional: runId and resultId
						(numbers)
					</p>
					<details className="text-sm">
						<summary className="cursor-pointer text-text-unexpected hover:underline">
							Show validation errors
						</summary>
						<pre className="mt-2 p-2 bg-bg-fillError/60 rounded text-xs overflow-auto">
							{JSON.stringify(result.error.format(), null, 2)}
						</pre>
					</details>
				</div>
			</div>
		);
	}

	const runId = 'runId' in result.data ? result.data.runId : undefined;
	const resultId = 'resultId' in result.data ? result.data.resultId : undefined;

	return (
		<NetPacketAnalyserContainer
			fileUrl={result.data.fileUrl}
			runId={runId}
			resultId={resultId}
		/>
	);
}

export { NetPacketAnalyzerPage };
