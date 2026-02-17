/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useGetRunFallingFreqQuery } from '@/services/bublik-api';

import { RunProgress } from './run-progress.component';

interface RunProgressContainerProps {
	runId: number;
}

export const RunProgressContainer = ({ runId }: RunProgressContainerProps) => {
	const { data, isLoading, isError, error } = useGetRunFallingFreqQuery(runId);

	return (
		<RunProgress
			data={data}
			isError={isError}
			isLoading={isLoading}
			error={error}
		/>
	);
};
