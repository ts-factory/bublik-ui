/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { LinkProps } from 'react-router-dom';

import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';

export interface LinkToHistoryProps extends LinkProps {
	isError: boolean;
	isLoading: boolean;
}

export const LinkToHistory = (props: LinkToHistoryProps) => {
	return (
		<ButtonTw
			variant="secondary"
			size="xss"
			state={
				props.isLoading ? 'loading' : props.isError ? 'disabled' : 'default'
			}
			asChild
		>
			<LinkWithProject to={props.to}>
				{props.isLoading ? (
					<Icon name="ProgressIndicator" className="mr-1.5 animate-spin" />
				) : (
					<Icon name="BoxArrowRight" className="mr-1.5" />
				)}
				History
			</LinkWithProject>
		</ButtonTw>
	);
};
