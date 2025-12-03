/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { routes } from '@/router';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';

interface LinkToRunProps {
	runId: string;
	targetIterationId?: number;
}

function LinkToRun(props: LinkToRunProps) {
	const { runId, targetIterationId } = props;

	return (
		<ButtonTw asChild variant="secondary" size="xss">
			<LinkWithProject to={routes.run({ runId, targetIterationId })}>
				<Icon name="BoxArrowRight" className="mr-1.5" />
				Run
			</LinkWithProject>
		</ButtonTw>
	);
}

export { LinkToRun };
