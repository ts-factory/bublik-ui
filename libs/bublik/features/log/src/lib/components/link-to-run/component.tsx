/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import { TypedLinkWithProject } from '@/bublik/features/projects';

export interface LinkToRunProps {
	runId: number;
	targetIterationId?: number | null;
}

export function LinkToRun(props: LinkToRunProps) {
	const { runId, targetIterationId } = props;

	return (
		<ButtonTw asChild variant="secondary" size="xss">
			<TypedLinkWithProject
				to="/runs/$runId"
				params={{ runId }}
				// The whole run when nothing (or `0`) is focused, as `routes.run` wrote it
				search={{ targetIterationId: targetIterationId || undefined }}
				onClick={() => {
					trackEvent(analyticsEventNames.logLinkToRunClick, {
						source: 'log_toolbar'
					});
				}}
			>
				<Icon name="BoxArrowRight" className="mr-1.5" />
				Run
			</TypedLinkWithProject>
		</ButtonTw>
	);
}
