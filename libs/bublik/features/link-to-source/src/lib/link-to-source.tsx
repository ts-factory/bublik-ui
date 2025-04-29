/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import { useGetRunSourceQuery } from '@/services/bublik-api';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';

interface LinkToSourceFeatureProps {
	runId: string;
}

function LinkToSourceContainer({ runId }: LinkToSourceFeatureProps) {
	const { data, isLoading, isError } = useGetRunSourceQuery(runId ?? skipToken);

	const url = data?.url ?? null;
	const hasValidUrl = Boolean(url);
	const isDisabled = isError || !hasValidUrl;
	const state = isLoading ? 'loading' : isDisabled ? 'disabled' : 'default';

	const title = isError
		? 'Error loading source'
		: !hasValidUrl
		? 'No source available'
		: 'View source';

	const iconName = isLoading ? 'ProgressIndicator' : 'BoxArrowRight';
	const iconClass = isLoading ? 'mr-1.5 animate-spin' : 'mr-1.5';

	return (
		<ButtonTw
			size="xss"
			variant="secondary"
			state={state}
			disabled={isDisabled}
			asChild
		>
			{hasValidUrl && url ? (
				<a href={url} title={title} target="_blank" rel="noopener noreferrer">
					<Icon name={iconName} className={iconClass} />
					Source
				</a>
			) : (
				<span title={title}>
					<Icon name={iconName} className={iconClass} />
					Source
				</span>
			)}
		</ButtonTw>
	);
}

export { LinkToSourceContainer };
