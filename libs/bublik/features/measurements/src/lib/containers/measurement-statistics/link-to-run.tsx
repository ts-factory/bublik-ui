/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';
import { Link } from 'react-router-dom';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';

export interface LinkToRunProps {
	runId: string;
}

export const LinkToRun: FC<LinkToRunProps> = ({ runId }) => {
	return (
		<ButtonTw asChild variant="secondary" size="xss">
			<Link to={`/runs/${runId}`}>
				<Icon name="BoxArrowRight" className="mr-1.5" />
				Run
			</Link>
		</ButtonTw>
	);
};
