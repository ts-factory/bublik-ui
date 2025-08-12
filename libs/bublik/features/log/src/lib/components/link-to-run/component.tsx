/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';

export interface LinkToRunProps {
	runId: string;
}

export function LinkToRun({ runId }: LinkToRunProps) {
	const to = { pathname: `/runs/${runId}` };

	return (
		<ButtonTw asChild variant="secondary" size="xss">
			<LinkWithProject to={to}>
				<Icon name="BoxArrowRight" className="mr-1.5" />
				Run
			</LinkWithProject>
		</ButtonTw>
	);
}
