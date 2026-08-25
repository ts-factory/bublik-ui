/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { skipToken } from '@reduxjs/toolkit/query';
import { useParams } from 'react-router-dom';

import { RunIssuesTable } from '@/bublik/features/result-classification';
import {
	getErrorMessage,
	useApplyRulesToRunMutation,
	useGetRunDetailsQuery
} from '@/services/bublik-api';
import { BublikEmptyState } from '@/bublik/features/ui-state';
import { ButtonTw, Icon, Tooltip, toast } from '@/shared/tailwind-ui';

interface ApplyRulesButtonProps {
	runId: string;
	projectId?: number;
}

function ApplyRulesButton({ runId, projectId }: ApplyRulesButtonProps) {
	const [applyRules, { isLoading }] = useApplyRulesToRunMutation();

	function handleApply() {
		const promise = applyRules({ runId, projectId }).unwrap();

		toast.promise(promise, {
			loading: 'Applying rules...',
			success: ({ stamps_created: stamps }) =>
				stamps === 0
					? 'Applied — no new stamps'
					: `Applied — ${stamps} stamp${stamps === 1 ? '' : 's'} created`,
			error: (err) => {
				const message = getErrorMessage(err);
				return `${message.title}\n${message.description}`;
			},
			position: 'top-center'
		});
	}

	return (
		<Tooltip content="Applies every active rule to this run only. Creating or activating a rule does not classify existing runs.">
			<ButtonTw
				variant="secondary"
				size="xss"
				state={isLoading ? 'loading' : 'default'}
				onClick={handleApply}
				data-testid="apply-rules-button"
			>
				<Icon name="Refresh" size={16} className="mr-1.5" />
				Apply rules
			</ButtonTw>
		</Tooltip>
	);
}

function RunIssuesPage() {
	const { runId } = useParams<{ runId: string }>();
	const { data: details } = useGetRunDetailsQuery(
		runId ? Number(runId) : skipToken
	);

	if (!runId) {
		return <BublikEmptyState title="No data" description="Run ID is missing" />;
	}

	return (
		<div className="flex flex-col gap-1 p-2" data-testid="run-issues-page">
			{/* The button lives on the page, not in the table: the table renders an
			    empty state when the run has no issues, which is exactly when you
			    most need to apply rules. */}
			<div className="flex items-center justify-between px-4 py-2 bg-white rounded-t-xl">
				<h1 className="text-lg font-semibold">Issues</h1>
				<ApplyRulesButton runId={runId} projectId={details?.project_id} />
			</div>
			<RunIssuesTable runId={runId} projectId={details?.project_id} />
		</div>
	);
}

export { RunIssuesPage };
