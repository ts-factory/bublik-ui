/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { skipToken } from '@reduxjs/toolkit/query';
import { useParams } from 'react-router-dom';

import { RunIssuesTable } from '@/bublik/features/result-classification';
import { useGetRunDetailsQuery } from '@/services/bublik-api';
import { BublikEmptyState } from '@/bublik/features/ui-state';

function RunIssuesPage() {
	const { runId } = useParams<{ runId: string }>();
	const { data: details } = useGetRunDetailsQuery(
		runId ? Number(runId) : skipToken
	);

	if (!runId) {
		return <BublikEmptyState title="No data" description="Run ID is missing" />;
	}

	return (
		<div className="flex flex-col gap-1 p-2">
			<RunIssuesTable runId={runId} projectId={details?.project_id} />
		</div>
	);
}

export { RunIssuesPage };
