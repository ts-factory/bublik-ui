/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { skipToken } from '@reduxjs/toolkit/query';

import {
	getErrorMessage,
	useApplyRulesToRunMutation,
	useGetRunDetailsQuery
} from '@/services/bublik-api';
import { ButtonTw, Icon, Tooltip, toast } from '@/shared/tailwind-ui';

import { useCanManageIssues } from '../shared/permissions.hooks';

const APPLY_RULES_HINT =
	'Applies every active rule to this run only. Creating or activating a rule does not classify existing runs.';

export interface ApplyRulesButtonProps {
	runId: string | number;
	/**
	 * Omit it and the run's own project is used. Every surface this button sits
	 * on already has the run details in flight, so the fallback query is free —
	 * the same trick `ClassifyResultContainer` uses.
	 */
	projectId?: number;
}

export function ApplyRulesButton({ runId, projectId }: ApplyRulesButtonProps) {
	const [applyRules, { isLoading }] = useApplyRulesToRunMutation();
	const { canManage, reason } = useCanManageIssues();
	const { data: details } = useGetRunDetailsQuery(
		projectId === undefined ? runId : skipToken
	);

	const resolvedProjectId = projectId ?? details?.project_id;

	function handleApply() {
		const promise = applyRules({
			runId,
			projectId: resolvedProjectId
		}).unwrap();

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
		<Tooltip content={reason || APPLY_RULES_HINT}>
			<ButtonTw
				variant="secondary"
				size="xss"
				disabled={!canManage}
				state={isLoading ? 'loading' : 'default'}
				onClick={handleApply}
				data-testid="apply-rules-button"
			>
				<Icon name="Refresh" size={16} className="mr-1.5" />
				Apply Rules
			</ButtonTw>
		</Tooltip>
	);
}
