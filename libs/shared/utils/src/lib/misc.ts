/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
export const getTotalPageCount = (totalCount: number, pageSize: number) => {
	return Math.ceil(totalCount / pageSize);
};

const getMiddleIndex = <T>(arr: T[], mode?: 'odd' | 'even') => {
	if (mode === 'even') return Math.floor(arr.length / 2);
	if (mode === 'odd') return Math.ceil(arr.length / 2);

	return Math.ceil(arr.length / 2);
};

export const splitInHalf = <T>(arr: T[], mode?: 'odd' | 'even'): [T[], T[]] => {
	const middleIndex = getMiddleIndex<T>(arr, mode);
	const firstHalf = arr.slice(0, middleIndex);
	const secondHalf = arr.slice(middleIndex, arr.length);

	return [firstHalf, secondHalf];
};

export const getRandomItemFromArray = <T>(array: T[]): T => {
	const randomIndex = Math.floor(Math.random() * array.length);

	return array[randomIndex];
};

export const upperCaseFirstLetter = (string: string) => {
	return string.slice().charAt(0).toUpperCase() + string.slice(1);
};

export const wrap = (totalLength: number, index: number) => {
	return ((index % totalLength) + totalLength) % totalLength;
};
