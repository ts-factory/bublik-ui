/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { bublikAPI, useGetRunDetailsQuery } from '@/services/bublik-api';

import {
	RunDetails,
	RunDetailsEmpty,
	RunDetailsError,
	RunDetailsLoading
} from './run-details.component';

export interface InfoContainerProps {
	runId: string | number;
	isFullMode?: boolean;
}

function RunDetailsContainer(props: InfoContainerProps) {
	const { runId, isFullMode } = props;
	const { data, isLoading, isFetching, error } = useGetRunDetailsQuery(
		props.runId
	);
	const {
		data: commentData,
		isLoading: commentIsLoading,
		error: commentError,
		isFetching: commentIsFetching
	} = bublikAPI.useGetRunCommentQuery({ runId: Number(runId) });

	if (error || commentError) {
		return <RunDetailsError error={error || commentError} />;
	}

	if (isLoading || commentIsLoading) {
		return <RunDetailsLoading />;
	}

	if (!data || !commentData) {
		return <RunDetailsEmpty />;
	}

	return (
		<RunDetails
			isFullMode={isFullMode}
			runId={data.id}
			conclusionReason={data.conclusion_reason}
			mainPackage={data.main_package}
			start={data.start}
			finish={data.finish}
			duration={data.duration}
			runStatus={data.conclusion}
			isCompromised={data.is_compromised}
			importantTags={data.important_tags}
			relevantTags={data.relevant_tags}
			branches={data.branches}
			revisions={data.revisions}
			labels={data.labels}
			specialCategories={data.special_categories}
			status={data.status}
			statusByNok={data.status_by_nok}
			isFetching={isFetching || commentIsFetching}
			runComment={commentData?.comment ?? ''}
		/>
	);
}

export { RunDetailsContainer };
