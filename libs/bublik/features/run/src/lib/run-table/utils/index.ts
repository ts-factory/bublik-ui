/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
export * from './expanding';
export * from './request-builder';
export * from './unexpected';
export * from './get-values';

export const getIsBorderGroup = <T extends string[][]>({
	currId,
	groups,
	nextId
}: {
	currId: string;
	nextId: string | undefined;
	groups: T;
}): boolean => {
	if (!nextId) return false;

	const currentColumnGroup = groups.findIndex((group) =>
		group.includes(currId)
	);

	const nextColumnGroup = groups.findIndex((group) => group.includes(nextId));

	if (currentColumnGroup === -1 || nextColumnGroup === -1) {
		return false;
	}

	return currentColumnGroup !== nextColumnGroup;
};
