/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import { LogPageMode } from '@/shared/types';

import { useLinkTarget } from '../../link-target';

export interface LinkToLogProps {
	runId: number;
	resultId: number;
}

export const LinkToLog = ({ runId, resultId }: LinkToLogProps) => {
	// `routes.log({ runId, focusId })`: the result focused, the full layout.
	const to = useLinkTarget({
		to: '/log/$runId',
		params: { runId },
		search: {
			focusId: resultId,
			mode: LogPageMode.TreeAndInfoAndLog
		}
	});

	return (
		<ButtonTw asChild variant="secondary" size="xss">
			<LinkWithProject
				to={to}
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
