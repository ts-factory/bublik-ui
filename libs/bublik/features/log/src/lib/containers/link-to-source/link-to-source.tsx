/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import { useGetRunSourceQuery } from '@/services/bublik-api';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';

export interface LinkToSourceProps {
	runId: string;
}

export const LinkToSourceContainer: FC<LinkToSourceProps> = ({ runId }) => {
	const { data, isFetching, isError } = useGetRunSourceQuery(runId);

	const isDisabled = isError || (data && !data.url);
	const to = data?.url || '';

	return (
		<ButtonTw
			asChild
			variant="secondary"
			size="xss"
			state={isFetching ? 'loading' : isDisabled ? 'disabled' : 'default'}
		>
			<a href={to}>
				{isFetching ? (
					<Icon name="ProgressIndicator" className="mr-1.5 animate-spin" />
				) : (
					<Icon name="BoxArrowRight" className="mr-1.5" />
				)}
				Source
			</a>
		</ButtonTw>
	);
};
