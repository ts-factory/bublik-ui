/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { routes } from '@/router';
import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import { useDefaultLogMode } from '@/bublik/features/user-preferences';

export interface LinkToLogProps {
	runId: string;
	resultId: string;
}

export const LinkToLog = ({ runId, resultId }: LinkToLogProps) => {
	const logMode = useDefaultLogMode();
	return (
		<ButtonTw asChild variant="secondary" size="xss">
			<LinkWithProject
				to={routes.log({ runId, focusId: resultId, mode: logMode })}
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
