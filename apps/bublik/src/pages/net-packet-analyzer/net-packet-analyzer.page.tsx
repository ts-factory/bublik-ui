import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import { NetPacketAnalyserContainer } from '@/bublik/features/net-analysis';

const SearchParamsSchema = z.object({
	fileUrl: z.string().url(),
	runId: z.coerce.number().optional(),
	resultId: z.coerce.number().optional()
});

export function NetPacketAnalyzerPage() {
	const [searchParams] = useSearchParams();
	const params = Object.fromEntries(searchParams.entries());
	const result = SearchParamsSchema.safeParse(params);

	if (!result.success) {
		return (
			<div className="grid place-items-center h-full">
				<div className="p-4 border border-red-300 bg-red-50 rounded-md">
					<h2 className="text-red-800 font-semibold mb-2">
						Invalid URL Parameters
					</h2>
					<p className="text-red-700 mb-3">
						Required: fileUrl (valid URL), optional: runId and resultId
						(numbers)
					</p>
					<details className="text-sm">
						<summary className="cursor-pointer text-red-600 hover:text-red-800">
							Show validation errors
						</summary>
						<pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
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
