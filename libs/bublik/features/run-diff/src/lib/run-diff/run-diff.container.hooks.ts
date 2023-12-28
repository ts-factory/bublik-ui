/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useGetRunTableByRunIdQuery } from '@/services/bublik-api';

export interface UseRunDiffStateConfig {
	leftRunId: string;
	rightRunId: string;
}

export const useRunDiffState = (config: UseRunDiffStateConfig) => {
	const { leftRunId, rightRunId } = config;

	const {
		data: leftData,
		isLoading: isLeftLoading,
		error: leftError
	} = useGetRunTableByRunIdQuery(leftRunId);
	const {
		data: rightData,
		isLoading: isRightLoading,
		error: rightError
	} = useGetRunTableByRunIdQuery(rightRunId);

	return {
		leftData,
		rightData,
		isLoading: isLeftLoading || isRightLoading,
		error: leftError || rightError
	};
};
