/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect, useRef } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { animate, motion, MotionValue, useMotionValue } from 'framer-motion';

import {
	getErrorMessage,
	useApplyRulesToRunMutation,
	useGetRunDetailsQuery
} from '@/services/bublik-api';
import { ButtonTw, Icon, Tooltip, toast } from '@/shared/tailwind-ui';
import { LoginRequired } from '@/bublik/features/auth';

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

/**
 * A rotation that turns steadily while `spinning`, then eases on to the next
 * full turn when it stops, with the history Submit button's spring — rather
 * than snapping back from wherever the request happened to end. Always at
 * least one whole turn, so an instant response still shows the click landed.
 */
function useSettlingSpin(spinning: boolean): MotionValue<number> {
	const rotate = useMotionValue(0);
	// Where the current spin started; `null` before the first one.
	const startedAt = useRef<number | null>(null);

	useEffect(() => {
		const from = rotate.get();

		if (spinning) {
			startedAt.current = from;

			const controls = animate(rotate, [from, from + 360], {
				duration: 0.8,
				ease: 'linear',
				repeat: Infinity
			});

			return () => controls.stop();
		}

		if (startedAt.current === null) return;

		const controls = animate(
			rotate,
			Math.max(Math.ceil(from / 360) * 360, startedAt.current + 360),
			{ type: 'spring', stiffness: 500, damping: 90 }
		);

		return () => controls.stop();
	}, [spinning, rotate]);

	return rotate;
}

export function ApplyRulesButton({ runId, projectId }: ApplyRulesButtonProps) {
	const [applyRules, { isLoading }] = useApplyRulesToRunMutation();
	const rotate = useSettlingSpin(isLoading);
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
		<LoginRequired message="Log in to apply rules">
			<Tooltip content={APPLY_RULES_HINT}>
				<ButtonTw
					variant="secondary"
					size="xss"
					state={isLoading ? 'loading' : 'default'}
					onClick={handleApply}
					aria-busy={isLoading}
					data-testid="apply-rules-button"
				>
					{/* Spins while the run is being classified; the `loading` state
					    alone only stops clicks, which looks like nothing happened. */}
					<motion.span style={{ rotate }} className="mr-1.5 grid size-5">
						<Icon name="Refresh" className="size-5" />
					</motion.span>
					Apply Rules
				</ButtonTw>
			</Tooltip>
		</LoginRequired>
	);
}
