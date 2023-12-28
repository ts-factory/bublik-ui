/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Link } from 'react-router-dom';

import { LogPageMode } from '@/shared/types';
import { routes } from '@/router';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';

export interface RunLinksProps {
	runId: number;
}

export const RunLinks = ({ runId }: RunLinksProps) => {
	return (
		<div className="flex flex-col items-start justify-center gap-1">
			<ButtonTw asChild variant="secondary" size="xss">
				<Link to={routes.log({ runId, mode: LogPageMode.TreeAndLog })}>
					<Icon name="BoxArrowRight" className="mr-1.5" />
					Log
				</Link>
			</ButtonTw>
			<ButtonTw asChild variant="secondary" size="xss">
				<Link to={routes.run({ runId })}>
					<Icon name="BoxArrowRight" className="mr-1.5" />
					Run
				</Link>
			</ButtonTw>
		</div>
	);
};
