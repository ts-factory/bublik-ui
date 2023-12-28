/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';
import { Link } from 'react-router-dom';

import { routes } from '@/router';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';

export interface LinkToLogProps {
	runId: string;
	resultId: string;
}

export const LinkToLog: FC<LinkToLogProps> = ({ runId, resultId }) => {
	return (
		<ButtonTw asChild variant="secondary" size="xss">
			<Link to={routes.log({ runId, focusId: resultId })}>
				<Icon name="BoxArrowRight" className="mr-1.5" />
				Log
			</Link>
		</ButtonTw>
	);
};
