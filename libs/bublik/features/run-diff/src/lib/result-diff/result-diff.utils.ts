/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { RESULT_TYPE, RunDataResults } from '@/shared/types';
import { uniqBy } from '@/shared/utils';

import { DiffType } from '../run-diff/run-diff.types';

export interface ComputeResultDiffConfig {
	left?: RunDataResults[];
	right?: RunDataResults[];
}

export const getResultId = (result: RunDataResults): string => {
	return result.iteration_id.toString();
};

export type RunDataResultsWithDiff = {
	left: RunDataResults | null;
	right: RunDataResults | null;
	diffType: DiffType;
};

export const computeResultsDiff = ({
	left = [],
	right = []
}: ComputeResultDiffConfig): RunDataResultsWithDiff[] => {
	const leftMap = new Map<string, RunDataResults>(
		Object.values(left).map((data) => [getResultId(data), data])
	);
	const rightMap = new Map<string, RunDataResults>(
		Object.values(right).map((data) => [getResultId(data), data])
	);

	const allRows = [
		...Array.from(leftMap.values()),
		...Array.from(rightMap.values())
	];

	const diffedRows = {
		[DiffType.ADDED]: right
			.filter((row) => !leftMap.has(getResultId(row)))
			.map(getResultId),
		[DiffType.REMOVED]: left
			.filter((row) => !rightMap.has(getResultId(row)))
			.map(getResultId)
	};

	return uniqBy(allRows, getResultId).map((item) => {
		let diffType: DiffType;
		const id = getResultId(item);

		if (diffedRows[DiffType.ADDED].includes(id)) {
			diffType = DiffType.ADDED;
		} else if (diffedRows[DiffType.REMOVED].includes(id)) {
			diffType = DiffType.REMOVED;
		} else {
			const left = leftMap.get(id);
			const right = rightMap.get(id);

			diffType = DiffType.DEFAULT;

			if (left && right) {
				const leftData: Record<string, RESULT_TYPE | boolean | string[]> = {
					resultType: left.obtained_result.result_type,
					isNotExpected: left.has_error,
					verdicts: left.obtained_result.verdict
				};

				const rightData: Record<string, RESULT_TYPE | boolean | string[]> = {
					resultType: right.obtained_result.result_type,
					isNotExpected: right.has_error,
					verdicts: right.obtained_result.verdict
				};

				const isChanged =
					JSON.stringify(leftData) !== JSON.stringify(rightData);

				if (isChanged) diffType = DiffType.CHANGED;
			}
		}

		return {
			left: leftMap.get(getResultId(item)) || null,
			right: rightMap.get(getResultId(item)) || null,
			diffType
		};
	});
};
