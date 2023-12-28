/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
const defaultEquality = <T>(last: T, curr: T) => curr === last;

type GetChunksOptions<T> = {
	data: T[];
	equality?: (last: T, curr: T) => boolean;
	skip?: (curr: T) => boolean;
};

export const getChunks = <T>({
	data,
	equality = defaultEquality,
	skip
}: GetChunksOptions<T>): (T[] | T)[] => {
	const result: (T[] | T)[] = [];

	let lastUniqueIdx = 0;
	let isSkipped = false;

	for (let i = 0; i < data.length; i++) {
		const last = data[i - 1];
		const current = data[i];

		if (skip?.(current)) {
			if (!equality(last, current) && last && current) {
				result.push(data.slice(lastUniqueIdx, i));
			}

			result.push(current);
			lastUniqueIdx = i + 1;
			isSkipped = true;

			continue;
		}

		if (i === 0) continue;

		if (i === data.length - 1) {
			if (!equality(last, current)) {
				const chunk = data.slice(lastUniqueIdx, i);
				const lastChunk = data.slice(-1);

				if (!isSkipped) result.push(chunk);
				result.push(lastChunk);

				break;
			}

			const chunk = data.slice(lastUniqueIdx);
			result.push(chunk);
		}

		if (equality(last, current)) continue;
		if (isSkipped) {
			isSkipped = false;
			continue;
		}

		const chunk = data.slice(lastUniqueIdx, i);
		result.push(chunk);
		lastUniqueIdx = i;
	}

	return result;
};
