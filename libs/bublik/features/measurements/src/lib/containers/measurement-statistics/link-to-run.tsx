/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';

export interface LinkToRunProps {
	runId: string;
}

export const LinkToRun = ({ runId }: LinkToRunProps) => {
	return (
		<ButtonTw asChild variant="secondary" size="xss">
			<LinkWithProject to={`/runs/${runId}`}>
				<Icon name="BoxArrowRight" className="mr-1.5" />
				Run
			</LinkWithProject>
		</ButtonTw>
	);
};
