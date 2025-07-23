/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { LogPageMode } from '@/shared/types';
import { routes } from '@/router';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';

export interface RunLinksProps {
	runId: number;
}

export const RunLinks = ({ runId }: RunLinksProps) => {
	return (
		<div className="flex flex-col items-start justify-center gap-1">
			<ButtonTw asChild variant="secondary" size="xss">
				<LinkWithProject
					to={routes.log({ runId, mode: LogPageMode.TreeAndLog })}
				>
					<Icon name="BoxArrowRight" className="mr-1.5" />
					Log
				</LinkWithProject>
			</ButtonTw>
			<ButtonTw asChild variant="secondary" size="xss">
				<LinkWithProject to={routes.run({ runId })}>
					<Icon name="BoxArrowRight" className="mr-1.5" />
					Run
				</LinkWithProject>
			</ButtonTw>
		</div>
	);
};
