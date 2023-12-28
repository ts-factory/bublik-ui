/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
const getStatusChunks = (statusArr: boolean[]) => {
	const stringStatuses = statusArr.map(mapStatusToString);

	return stringStatuses.reduce(getStatusChunk(), []);
};

export type RunStatus = 'ok' | 'nok';

const mapStatusToString = (status: boolean): RunStatus => {
	return status ? 'nok' : 'ok';
};

const getStatusChunk =
	(lastUniqueIndex = 0) =>
	(acc: RunStatus[][], curr: RunStatus, index: number, arr: RunStatus[]) => {
		const isFirstItem = index === 0;
		const isLastItem = index + 1 === arr.length;
		const lastItem = arr[index - 1];
		let chunk: RunStatus[][];

		if (isFirstItem) return acc;

		if (isLastItem) {
			if (lastItem !== curr) {
				chunk = [arr.slice(lastUniqueIndex, index), arr.slice(-1)];

				return [...acc, ...chunk];
			}

			return [...acc, arr.slice(lastUniqueIndex, index + 1)];
		}

		if (lastItem !== curr) {
			const result = [...acc, arr.slice(lastUniqueIndex, index)];

			lastUniqueIndex = index;

			return result;
		}

		return acc;
	};

const mapToBasis = (lengthSum: number) => (statusArr: RunStatus[]) => {
	return {
		status: statusArr[0],
		basis: Math.ceil((statusArr.length / lengthSum) * 100)
	};
};

export const getStatusAndBasis = (data: boolean[]) => {
	const chunkArr = getStatusChunks(data);

	const lengthSum = chunkArr.reduce((acc, curr) => acc + curr.length, 0);

	return chunkArr.map(mapToBasis(lengthSum));
};
