/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { skipToken } from '@reduxjs/toolkit/dist/query';
import { useGetRunSourceQuery } from '@/services/bublik-api';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';

interface LinkToSourceFeatureProps {
	runId: string;
}

function LinkToSourceContainer({ runId }: LinkToSourceFeatureProps) {
	const { data, isLoading, isError } = useGetRunSourceQuery(runId ?? skipToken);

	const hasValidUrl = Boolean(data?.url);
	const isDisabled = isError || !hasValidUrl;
	const url = hasValidUrl ? data?.url ?? '#' : '#';

	return (
		<ButtonTw
			size="xss"
			variant="secondary"
			state={isLoading ? 'loading' : isDisabled ? 'disabled' : 'default'}
			disabled={isDisabled}
			asChild
		>
			<a
				href={url}
				onClick={isDisabled ? (e) => e.preventDefault() : undefined}
				title={
					isError
						? 'Error loading source'
						: !hasValidUrl
						? 'No source available'
						: 'View source'
				}
			>
				{isLoading ? (
					<Icon name="ProgressIndicator" className="mr-1.5 animate-spin" />
				) : (
					<Icon name="BoxArrowRight" className="mr-1.5" />
				)}
				Source
			</a>
		</ButtonTw>
	);
}

export { LinkToSourceContainer };
