/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { routes } from '@/router';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import { useDefaultLogMode } from '@/bublik/features/user-preferences';

export interface RunLinksProps {
	runId: number;
}

export const RunLinks = ({ runId }: RunLinksProps) => {
	const logMode = useDefaultLogMode();

	return (
		<div className="flex flex-col items-start justify-center gap-1">
			<ButtonTw asChild variant="secondary" size="xss">
				<LinkWithProject
					data-testid="run-log-link"
					to={routes.log({ runId, mode: logMode })}
				>
					<Icon name="BoxArrowRight" className="mr-1.5" />
					Log
				</LinkWithProject>
			</ButtonTw>
			<ButtonTw asChild variant="secondary" size="xss">
				<LinkWithProject
					data-testid="run-details-link"
					to={routes.run({ runId })}
				>
					<Icon name="BoxArrowRight" className="mr-1.5" />
					Run
				</LinkWithProject>
			</ButtonTw>
		</div>
	);
};
