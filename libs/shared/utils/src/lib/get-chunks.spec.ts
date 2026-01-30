/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { it, describe, expect } from 'vitest';
import { getChunks } from './get-chunks';
const testFor = (numberForTest: number) => (number: number) =>
	numberForTest === number;
describe('getChunks function', () => {
	it('should return chunks in simple case', () => {
		const data = [1, 1, 2, 2, 3, 3];
		const result = [
			[1, 1],
			[2, 2],
			[3, 3]
		];
		expect(getChunks({ data })).toEqual(result);
	});
	it('should handle items in the middle of array', () => {
		const data = [1, 2, 3, 5, 5, 6];
		const result = [[1], [2], [3], [5, 5], [6]];
		expect(getChunks({ data })).toEqual(result);
	});
	it('should handle first item in array', () => {
		const data = [1, 2, 2, 3, 3];
		const result = [[1], [2, 2], [3, 3]];
		expect(getChunks({ data })).toEqual(result);
	});
	it('should handle last item in array', () => {
		const data = [1, 2, 2, 2, 4];
		const result = [[1], [2, 2, 2], [4]];
		expect(getChunks({ data })).toEqual(result);
	});
	it('should handle just points', () => {
		const data = [1, 2, 3, 4, 5];
		const result = [[1], [2], [3], [4], [5]];
		expect(getChunks({ data })).toEqual(result);
	});
	it('should skip in the beginning with one item', () => {
		const data = [1, 2, 3];
		const result = [1, [2], [3]];
		expect(getChunks({ data, skip: testFor(1) })).toEqual(result);
	});
	it('should skip in the middle with one item', () => {
		const data = [1, 2, 3];
		const result = [[1], 2, [3]];
		expect(getChunks({ data, skip: testFor(2) })).toEqual(result);
	});
	it('should skip in the end with one item', () => {
		const data = [1, 2, 3];
		const result = [[1], [2], 3];
		expect(getChunks({ data, skip: testFor(3) })).toEqual(result);
	});
	it('should handle skipping in beginning', () => {
		const data = [1, 1, 2, 2, 3, 3];
		const result = [1, 1, [2, 2], [3, 3]];
		expect(getChunks({ data, skip: testFor(1) })).toEqual(result);
	});
	it('should handle skipping in middle', () => {
		const data = [1, 1, 2, 2, 3, 3];
		const result = [[1, 1], 2, 2, [3, 3]];
		expect(getChunks({ data, skip: testFor(2) })).toEqual(result);
	});
	it('should handle skipping in end', () => {
		const data = [1, 1, 2, 2, 3, 3];
		const result = [[1, 1], [2, 2], 3, 3];
		expect(getChunks({ data, skip: testFor(3) })).toEqual(result);
	});
	it('should handle variouts items', () => {
		const data = [1, 2, 1, 2, 4, 1];
		const result = [[1], 2, [1], 2, [4], [1]];
		expect(getChunks({ data, skip: testFor(2) })).toEqual(result);
	});
});
