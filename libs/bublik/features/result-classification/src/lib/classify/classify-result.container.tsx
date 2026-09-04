/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { skipToken } from '@reduxjs/toolkit/query';

import {
	useGetResultInfoQuery,
	useGetRunDetailsQuery
} from '@/services/bublik-api';

import { ClassifyButton } from './classify-button.container';

export interface ClassifyResultContainerProps {
	/** Focused result. Undefined (no test node focused) renders nothing. */
	resultId?: number;
	/** Fallback project source when the result payload omits `project_id`. */
	runId?: number;
}

/**
 * Classify button for surfaces that hold only ids — the log page and the log
 * preview drawer. Both need the same two facts before they can show it (did
 * the result fail, and which project is it in), and `GET /results/{id}`
 * carries both. The run table does not use this: its rows already have the
 * full result, so it renders `ClassifyButton` directly.
 */
export function ClassifyResultContainer({
	resultId,
	runId
}: ClassifyResultContainerProps) {
	const { data: result } = useGetResultInfoQuery(resultId ?? skipToken);
	const { data: details } = useGetRunDetailsQuery(runId ?? skipToken);

	if (!resultId || !result) return null;

	const isFailed = result.has_error || (result.issues?.length ?? 0) > 0;

	if (!isFailed) return null;

	return (
		<ClassifyButton
			resultId={resultId}
			projectId={result.project_id ?? details?.project_id}
		/>
	);
}
