/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import { LogPageMode } from '@/shared/types';

export interface LinkToLogProps {
	runId: number;
	resultId: number;
}

export const LinkToLog = ({ runId, resultId }: LinkToLogProps) => {
	return (
		<ButtonTw asChild variant="secondary" size="xss">
			{/* The result focused, the full layout */}
			<LinkWithProject
				to="/log/$runId"
				params={{ runId }}
				search={{ focusId: resultId, mode: LogPageMode.TreeAndInfoAndLog }}
				onClick={() => {
					trackEvent(analyticsEventNames.measurementsLinkToLogClick, {
						source: 'measurements_header'
					});
				}}
			>
				<Icon name="BoxArrowRight" className="mr-1.5" />
				Log
			</LinkWithProject>
		</ButtonTw>
	);
};
