/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';
import { Link, LinkProps } from 'react-router-dom';

import { ButtonTw, Icon } from '@/shared/tailwind-ui';

export interface LinkToHistoryProps extends LinkProps {
	isError: boolean;
	isLoading: boolean;
}

export const LinkToHistory: FC<LinkToHistoryProps> = (props) => {
	return (
		<ButtonTw
			variant="secondary"
			size="xss"
			state={
				props.isLoading ? 'loading' : props.isError ? 'disabled' : 'default'
			}
			asChild
		>
			<Link to={props.to}>
				{props.isLoading ? (
					<Icon name="ProgressIndicator" className="mr-1.5 animate-spin" />
				) : (
					<Icon name="BoxArrowRight" className="mr-1.5" />
				)}
				History
			</Link>
		</ButtonTw>
	);
};
