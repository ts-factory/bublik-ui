/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
/**
|--------------------------------------------------
| REVISION
|--------------------------------------------------
*/

export const REVISION_POSTFIX = '_REV';
export const BRANCH_POSTFIX = '_BRANCH';

export const isRevision = (str: string): boolean => {
	return !!str.match(`(?:${REVISION_POSTFIX})`);
};

export const removePostfix = (revision: string, postfix: string) => {
	return revision.replace(postfix, '');
};

export const trimRevision = (revision: string) => {
	const [rawName, rawSha] = revision.split('=');

	const sha = rawSha.slice(0, 8);
	const name = removePostfix(rawName, REVISION_POSTFIX);

	return `${name}=${sha}`;
};

export const isBranch = (str: string): boolean => {
	return !!str.match(`(?:${BRANCH_POSTFIX})`);
};

export const trimBranch = (branch: string) => {
	return removePostfix(branch, BRANCH_POSTFIX);
};
