/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { skipToken } from '@reduxjs/toolkit/query';

import {
	useGetResultInfoQuery,
	useGetRunDetailsQuery
} from '@/services/bublik-api';

import { ClassifyButton } from './classify-button.container';

export interface ClassifyResultContainerProps {
	resultId?: number;
	runId?: number;
}

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
