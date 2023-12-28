/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';
import { skipToken } from '@reduxjs/toolkit/dist/query';

import { useGetRunSourceQuery } from '@/services/bublik-api';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';

export interface LinkToSourceFeatureProps {
	runId: string;
}

export const LinkToSourceContainer: FC<LinkToSourceFeatureProps> = ({
	runId
}) => {
	const { data, isLoading, isError } = useGetRunSourceQuery(runId ?? skipToken);
	const to = isError || isLoading ? '' : data?.url || '';

	return (
		<ButtonTw
			asChild
			size="xss"
			variant="secondary"
			state={isLoading ? 'loading' : isError ? 'disabled' : 'default'}
		>
			<a href={to}>
				{isLoading ? (
					<Icon name="ProgressIndicator" className="mr-1.5 animate-spin" />
				) : (
					<Icon name="BoxArrowRight" className="mr-1.5" />
				)}
				Source
			</a>
		</ButtonTw>
	);
};
