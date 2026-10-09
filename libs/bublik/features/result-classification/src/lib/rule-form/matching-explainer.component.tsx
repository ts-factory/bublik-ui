/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useState, type RefObject } from 'react';
import { PopoverPortal } from '@radix-ui/react-popover';

import {
	Icon,
	Popover,
	PopoverContent,
	PopoverTrigger
} from '@/shared/tailwind-ui';

import { MATCH_SCOPE_COPY } from './match-scope.copy';

/**
 * "How matching works", beside the Scope section's name: a popover rather
 * than five tooltips, so the reader sees the dimensions against each other
 * once, and the field tooltips can stay one line.
 */
export function MatchingExplainer({
	container
}: {
	container?: RefObject<HTMLElement>;
}) {
	const [open, setOpen] = useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className="inline-flex shrink-0 items-center gap-1 rounded px-1 text-[0.6875rem] font-medium normal-case tracking-normal text-primary hover:bg-primary-wash"
					data-testid="matching-explainer"
				>
					<Icon name="InformationCircleQuestionMark" size={14} />
					How matching works
				</button>
			</PopoverTrigger>
			<PopoverPortal container={container?.current ?? undefined}>
				<PopoverContent
					className="z-[60] w-[36rem] max-w-[calc(100vw-2rem)] rounded-lg bg-white p-5 text-[0.8125rem] leading-5 shadow-popover"
					align="start"
					sideOffset={4}
				>
					<div className="mb-4 flex flex-col text-text-secondary">
						<p>A rule matches a future failure when every part below holds.</p>
						<p>A part left empty is skipped.</p>
					</div>
					<dl className="flex flex-col gap-3">
						{MATCH_SCOPE_COPY.explainer.map(({ term, text }) => (
							<div key={term} className="flex flex-col gap-0.5">
								<dt className="text-[0.6875rem] font-bold uppercase tracking-wider text-text-menu">
									{term}
								</dt>
								<dd className="text-text-secondary">{text}</dd>
							</div>
						))}
					</dl>
				</PopoverContent>
			</PopoverPortal>
		</Popover>
	);
}
