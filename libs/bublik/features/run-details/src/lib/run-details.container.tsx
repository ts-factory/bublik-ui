/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import { useGetRunDetailsQuery } from '@/services/bublik-api';

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

export const RunDetailsContainer: FC<InfoContainerProps> = ({
	runId,
	isFullMode
}) => {
	const { data, isLoading, isFetching, error } = useGetRunDetailsQuery(runId);

	if (error) return <RunDetailsError error={error} />;

	if (isLoading) return <RunDetailsLoading />;

	if (!data) return <RunDetailsEmpty />;

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
			isFetching={isFetching}
		/>
	);
};
