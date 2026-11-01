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
	/** When the drawer opens or closes; see `ClassifyButton`. */
	onOpenChange?: (open: boolean) => void;
}

export function ClassifyResultContainer({
	resultId,
	runId,
	onOpenChange
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
			onOpenChange={onOpenChange}
		/>
	);
}
