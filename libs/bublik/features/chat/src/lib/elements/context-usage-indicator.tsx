/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { Tooltip, cn } from '@/shared/tailwind-ui';

/**
 * Composer-toolbar meter showing how full the selected model's context window
 * is. Fed by the thread's persisted `context_usage` on load and by the
 * server's `bublik.chat.context_usage` CUSTOM events live (see connection.ts);
 * the percentage is computed against the *usage model's* recorded limit,
 * falling back to the currently selected model when no recorded limit exists.
 * Renders a standalone "compacted" status even when token count or limit is
 * unavailable; the percentage ring only appears when both are known.
 */
export function ContextUsageIndicator({
	tokens,
	limit,
	compacted
}: {
	tokens: number | undefined;
	limit: number | undefined | null;
	compacted?: boolean;
}) {
	const hasMeter =
		typeof tokens === 'number' &&
		tokens > 0 &&
		typeof limit === 'number' &&
		limit > 0;

	if (!hasMeter && !compacted) return null;

	if (!hasMeter) {
		return (
			<Tooltip content="Older messages are summarized for the model; the visible conversation is unaffected.">
				<div
					className="flex h-full items-center gap-1 px-1 text-[0.6875rem] font-medium text-text-secondary cursor-default"
					aria-label="Conversation compacted"
				>
					compacted
				</div>
			</Tooltip>
		);
	}

	// TSC narrows tokens/limit to `number` after the checks above; copy to
	// locals to avoid non-null assertions (lint forbids `!`).
	const safeTokens = tokens;
	const safeLimit = limit;

	const fraction = Math.min(safeTokens / safeLimit, 1);
	const percent = Math.round(fraction * 100);
	const tone =
		fraction >= 0.9
			? 'text-bg-error'
			: fraction >= 0.7
			? 'text-amber-600'
			: 'text-text-secondary';

	const tooltip = [
		`~${safeTokens.toLocaleString()} of ${safeLimit.toLocaleString()} context tokens used (${percent}%)`,
		compacted
			? 'Older messages are summarized for the model; the visible conversation is unaffected.'
			: null
	]
		.filter(Boolean)
		.join('\n');

	// Ring geometry: radius 8 in a 20x20 viewBox, stroke consumed clockwise
	// from 12 o'clock via dasharray over the circumference.
	const radius = 8;
	const circumference = 2 * Math.PI * radius;

	return (
		<Tooltip content={tooltip}>
			<div
				className={cn(
					'flex h-full items-center gap-1 px-1 text-[0.6875rem] font-medium cursor-default',
					tone
				)}
				aria-label={`Context window ${percent}% full`}
			>
				<svg viewBox="0 0 20 20" className="size-3.5 -rotate-90">
					<circle
						cx="10"
						cy="10"
						r={radius}
						fill="none"
						stroke="currentColor"
						strokeOpacity="0.25"
						strokeWidth="3"
					/>
					<circle
						cx="10"
						cy="10"
						r={radius}
						fill="none"
						stroke="currentColor"
						strokeWidth="3"
						strokeLinecap="round"
						strokeDasharray={`${fraction * circumference} ${circumference}`}
					/>
				</svg>
				{percent}%
				{compacted ? <span className="opacity-70">· compacted</span> : null}
			</div>
		</Tooltip>
	);
}
