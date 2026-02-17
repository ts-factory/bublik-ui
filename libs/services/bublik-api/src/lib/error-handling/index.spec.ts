/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, it, expect } from 'vitest';
import {
	getErrorDetails,
	getErrorMessage,
	getErrorViewModel,
	isUnifiedError
} from './index';

describe('Unified Error Handling', () => {
	describe('isUnifiedError', () => {
		it('should recognize unified error format with array messages', () => {
			const error = {
				status: 400,
				data: { messages: ['Error 1', 'Error 2'] }
			};
			expect(isUnifiedError(error)).toBe(true);
		});

		it('should recognize unified error format with string messages', () => {
			const error = {
				status: 500,
				data: { messages: 'Server error occurred' }
			};
			expect(isUnifiedError(error)).toBe(true);
		});

		it('should recognize unified error format with object messages', () => {
			const error = {
				status: 422,
				data: {
					messages: { name: ['Name required'], email: ['Invalid email'] }
				}
			};
			expect(isUnifiedError(error)).toBe(true);
		});

		it('should not recognize old error formats', () => {
			const oldError = {
				status: 400,
				data: { type: 'ValidationError', message: { name: ['error'] } }
			};
			expect(isUnifiedError(oldError)).toBe(false);
		});
	});

	describe('getErrorMessage', () => {
		it('should handle unified error with array messages', () => {
			const error = {
				status: 400,
				data: { messages: ['Error 1', 'Error 2'] }
			};
			const result = getErrorMessage(error);
			expect(result).toEqual({
				status: 400,
				title: 'Error',
				description: 'Error 1, Error 2'
			});
		});

		it('should handle unified error with string messages', () => {
			const error = {
				status: 500,
				data: { messages: 'Server error occurred' }
			};
			const result = getErrorMessage(error);
			expect(result).toEqual({
				status: 500,
				title: 'Error',
				description: 'Server error occurred'
			});
		});

		it('should handle unified error with object messages (validation)', () => {
			const error = {
				status: 422,
				data: {
					messages: { name: ['Name required'], email: ['Invalid email'] }
				}
			};
			const result = getErrorMessage(error);
			expect(result).toEqual({
				status: 422,
				title: 'Validation error',
				description: 'name: Name required\nemail: Invalid email'
			});
		});

		it('should still handle old error formats', () => {
			const oldError = {
				status: 400,
				data: { type: 'ValidationError', message: { name: ['error'] } }
			};
			const result = getErrorMessage(oldError);
			expect(result.status).toBe(400);
			expect(result.title).toBe('ValidationError');
		});

		it('should handle unexpected server error', () => {
			const unexpectedError = {
				status: 500,
				data: {
					messages: [
						'Unexpected server error. Try refreshing and let us know if it keeps happening.'
					]
				}
			};
			const result = getErrorMessage(unexpectedError);
			expect(result).toEqual({
				status: 500,
				title: 'Error',
				description:
					'Unexpected server error. Try refreshing and let us know if it keeps happening.'
			});
		});
	});

	describe('getErrorDetails', () => {
		it('should return details list for array messages', () => {
			const error = {
				status: 400,
				data: { messages: ['Error 1', 'Error 2'] }
			};

			expect(getErrorDetails(error)).toEqual(['Error 1', 'Error 2']);
		});

		it('should return flattened details list for object messages', () => {
			const error = {
				status: 422,
				data: {
					messages: {
						name: ['Name required'],
						email: ['Invalid email']
					}
				}
			};

			expect(getErrorDetails(error)).toEqual([
				'name: Name required',
				'email: Invalid email'
			]);
		});
	});

	describe('getErrorViewModel', () => {
		it('should combine parsed error message and details', () => {
			const error = {
				status: 422,
				data: {
					messages: {
						name: ['Name required'],
						email: ['Invalid email']
					}
				}
			};

			expect(getErrorViewModel(error)).toEqual({
				status: 422,
				title: 'Validation error',
				description: 'name: Name required\nemail: Invalid email',
				details: ['name: Name required', 'email: Invalid email']
			});
		});
	});
});
