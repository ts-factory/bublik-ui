/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';

import { useLinkTarget } from '../../link-target';

interface LinkToRunProps {
	runId: string;
	targetIterationId?: number;
}

function LinkToRun(props: LinkToRunProps) {
	const { runId, targetIterationId } = props;
	// `routes.run({ runId, targetIterationId })`: no key for a missing or zero id.
	const to = useLinkTarget({
		to: '/runs/$runId',
		params: { runId },
		search: { targetIterationId: targetIterationId || undefined }
	});

	return (
		<ButtonTw asChild variant="secondary" size="xss">
			<LinkWithProject
				to={to}
				onClick={() => {
					trackEvent(analyticsEventNames.measurementsLinkToRunClick, {
						source: 'measurements_header'
					});
				}}
			>
				<Icon name="BoxArrowRight" className="mr-1.5" />
				Run
			</LinkWithProject>
		</ButtonTw>
	);
}

export { LinkToRun };
