/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
export const indentEnv = (string: string, indentLevel = 6) => {
	let level = 0;
	let indented = '';

	for (let i = 0; i < string.length; i++) {
		if (string[i] === '{') {
			indented += string[i];
			indented += '\n';
			level += indentLevel;
			indented += Array(level).join(' ');
		} else if (string[i] === '}') {
			indented += '\n';
			level -= indentLevel;
			indented += Array(level).join(' ');
			indented += string[i];
		} else if (string[i] === ',') {
			indented += string[i];
			indented += '\n';
			indented += Array(level).join(' ');
		} else {
			indented += string[i];
		}
	}

	return indented;
};

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
