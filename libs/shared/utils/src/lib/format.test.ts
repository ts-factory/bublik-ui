/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { it, describe, expect } from 'vitest';
import {
	BRANCH_POSTFIX,
	isBranch,
	isRevision,
	removePostfix,
	trimRevision
} from './format';
const REVISION = 'TE_REV=8edf7efb6341115d160dc7409626912f10b7e92c';
const EXPECTED_REVISION = 'TE=8edf7efb';
const BRANCH = 'TS_BRANCH=master';
describe('Formatting revision', () => {
	it('Should correctly detect revision', () => {
		expect(isRevision(REVISION)).toBeTruthy();
		expect(isRevision(BRANCH)).toBeFalsy();
	});
	it('Should trim sha to 8 chars', () => {
		expect(trimRevision(REVISION)).toBe(EXPECTED_REVISION);
	});
});
describe('Formatting branch', () => {
	it('Should correctly detect branch', () => {
		expect(isBranch(BRANCH)).toBeTruthy();
		expect(isBranch(REVISION)).toBeFalsy();
	});
	it('Should remove branch postfix', () => {
		expect(removePostfix(BRANCH, BRANCH_POSTFIX)).toBe('TS=master');
	});
});
