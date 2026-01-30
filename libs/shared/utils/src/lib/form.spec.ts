/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { it, describe, expect, vi } from 'vitest';
import { UseFormReturn } from 'react-hook-form';

import { setErrorsOnForm } from './form';

type TestFormData = {
	name: string;
	email: string;
	password: string;
};

describe('setErrorsOnForm', () => {
	const createMockFormHandle = () => {
		const setError = vi.fn();
		const onSetError = vi.fn();
		const handle = {
			setError,
			formState: { errors: {} }
		} as unknown as UseFormReturn<TestFormData>;

		return { setError, onSetError, handle };
	};

	describe('String Error Format', () => {
		it('should set root error for string data', () => {
			const { setError, onSetError, handle } = createMockFormHandle();

			setErrorsOnForm<TestFormData>(
				{ status: 400, data: 'This is a string error' },
				{ handle, onSetError }
			);

			expect(setError).toHaveBeenCalledWith('root', {
				type: 'custom',
				message: 'This is a string error'
			});
			expect(onSetError).not.toHaveBeenCalled();
		});
	});

	describe('Just Error Format', () => {
		it('should set root error for simple message object', () => {
			const { setError, onSetError, handle } = createMockFormHandle();

			setErrorsOnForm<TestFormData>(
				{ status: 400, data: { message: 'Simple error message' } },
				{ handle, onSetError }
			);

			expect(setError).toHaveBeenCalledWith('root', {
				type: 'custom',
				message: 'Simple error message'
			});
			expect(onSetError).not.toHaveBeenCalled();
		});
	});

	describe('New Error - Array Format', () => {
		it('should set root error with first message from array', () => {
			const { setError, onSetError, handle } = createMockFormHandle();

			setErrorsOnForm<TestFormData>(
				{
					status: 500,
					data: {
						messages: [
							'Unexpected server error. Try refreshing and let us know if it keeps happening.'
						]
					}
				},
				{ handle, onSetError }
			);

			expect(setError).toHaveBeenCalledWith('root', {
				type: 'custom',
				message:
					'Unexpected server error. Try refreshing and let us know if it keeps happening.'
			});
			expect(onSetError).not.toHaveBeenCalled();
		});

		it('should use fallback if messages array is empty', () => {
			const { setError, onSetError, handle } = createMockFormHandle();

			setErrorsOnForm<TestFormData>(
				{ status: 500, data: { messages: [] } },
				{ handle, onSetError }
			);

			expect(setError).toHaveBeenCalledWith('root', {
				type: 'custom',
				message: 'Unknown error!'
			});
		});

		it('should use first message if array has multiple items', () => {
			const { setError, onSetError, handle } = createMockFormHandle();

			setErrorsOnForm<TestFormData>(
				{
					status: 500,
					data: { messages: ['First error', 'Second error', 'Third error'] }
				},
				{ handle, onSetError }
			);

			expect(setError).toHaveBeenCalledWith('root', {
				type: 'custom',
				message: 'First error'
			});
		});
	});

	describe('New Error - Object Format', () => {
		it('should set field-level errors for each field', () => {
			const { setError, onSetError, handle } = createMockFormHandle();

			setErrorsOnForm<TestFormData>(
				{
					status: 400,
					data: {
						messages: {
							name: ['Name is required'],
							email: ['Email is invalid'],
							password: ['Password too short']
						}
					}
				},
				{ handle, onSetError }
			);

			expect(setError).toHaveBeenCalledWith('name', {
				type: 'custom',
				message: 'Name is required'
			});
			expect(setError).toHaveBeenCalledWith('email', {
				type: 'custom',
				message: 'Email is invalid'
			});
			expect(setError).toHaveBeenCalledWith('password', {
				type: 'custom',
				message: 'Password too short'
			});
			expect(onSetError).toHaveBeenCalledTimes(3);
		});

		it('should handle string values in messages object', () => {
			const { setError, onSetError, handle } = createMockFormHandle();

			setErrorsOnForm<TestFormData>(
				{
					status: 400,
					data: {
						messages: {
							name: 'Single error string',
							email: 'Another string'
						}
					}
				},
				{ handle, onSetError }
			);

			expect(setError).toHaveBeenCalledWith('name', {
				type: 'custom',
				message: 'Single error string'
			});
			expect(setError).toHaveBeenCalledWith('email', {
				type: 'custom',
				message: 'Another string'
			});
		});

		it('should use first error from array', () => {
			const { setError, onSetError, handle } = createMockFormHandle();

			setErrorsOnForm<TestFormData>(
				{
					status: 400,
					data: {
						messages: {
							name: ['First error', 'Second error', 'Third error']
						}
					}
				},
				{ handle, onSetError }
			);

			expect(setError).toHaveBeenCalledWith('name', {
				type: 'custom',
				message: 'First error'
			});
		});

		it('should call onSetError callback for each field error', () => {
			const { setError, onSetError, handle } = createMockFormHandle();

			setErrorsOnForm<TestFormData>(
				{
					status: 400,
					data: {
						messages: {
							name: ['Error 1'],
							email: ['Error 2']
						}
					}
				},
				{ handle, onSetError }
			);

			expect(setError).toHaveBeenCalledWith('name', {
				type: 'custom',
				message: 'Error 1'
			});
			expect(setError).toHaveBeenCalledWith('email', {
				type: 'custom',
				message: 'Error 2'
			});
			expect(onSetError).toHaveBeenCalledWith(
				'name',
				{ type: 'custom', message: 'Error 1' },
				handle
			);
			expect(onSetError).toHaveBeenCalledWith(
				'email',
				{ type: 'custom', message: 'Error 2' },
				handle
			);
		});
	});

	describe('Old Error Schema - Message Object', () => {
		it('should set field-level errors for old format with type and message object', () => {
			const { setError, onSetError, handle } = createMockFormHandle();

			setErrorsOnForm<TestFormData>(
				{
					status: 400,
					data: {
						type: 'ValidationError',
						message: {
							name: ['Name is required'],
							email: ['Invalid email format']
						}
					}
				},
				{ handle, onSetError }
			);

			expect(setError).toHaveBeenCalledWith('name', {
				type: 'custom',
				message: 'Name is required'
			});
			expect(setError).toHaveBeenCalledWith('email', {
				type: 'custom',
				message: 'Invalid email format'
			});
			expect(onSetError).toHaveBeenCalledTimes(2);
		});
	});

	describe('500 Error Fallback', () => {
		it('should JSON stringify 500 errors that do not match schemas', () => {
			const { setError, onSetError, handle } = createMockFormHandle();

			const error = {
				status: 500,
				data: { unexpected: 'data structure' },
				extra: 'field'
			};

			setErrorsOnForm<TestFormData>(error, { handle, onSetError });

			const errorMessage = JSON.stringify(error, null, 2);
			expect(setError).toHaveBeenCalledWith('root', {
				type: 'json',
				message: errorMessage
			});
		});

		it('should handle JSON stringify errors gracefully', () => {
			const { setError, onSetError, handle } = createMockFormHandle();

			const circularError = { status: 500, data: {} } as {
				status: number;
				data: { self?: unknown };
			};
			circularError.data.self = circularError;

			setErrorsOnForm<TestFormData>(circularError, { handle, onSetError });

			expect(setError).toHaveBeenCalledWith('root', {
				message: 'Unknown error!'
			});
		});
	});

	describe('Unknown Error', () => {
		it('should set Unknown error for unrecognised error format', () => {
			const { setError, onSetError, handle } = createMockFormHandle();

			setErrorsOnForm<TestFormData>(
				{ random: 'object structure' },
				{ handle, onSetError }
			);

			expect(setError).toHaveBeenCalledWith('root', {
				message: 'Unknown error!'
			});
		});

		it('should handle null error', () => {
			const { setError, onSetError, handle } = createMockFormHandle();

			setErrorsOnForm<TestFormData>(null, { handle, onSetError });

			expect(setError).toHaveBeenCalledWith('root', {
				message: 'Unknown error!'
			});
		});

		it('should handle undefined error', () => {
			const { setError, onSetError, handle } = createMockFormHandle();

			setErrorsOnForm<TestFormData>(undefined, { handle, onSetError });

			expect(setError).toHaveBeenCalledWith('root', {
				message: 'Unknown error!'
			});
		});

		it('should work without onSetError callback', () => {
			const { onSetError, handle } = createMockFormHandle();

			setErrorsOnForm<TestFormData>(
				{
					status: 400,
					data: { messages: { name: ['Error'] } }
				},
				{ handle }
			);

			expect(handle.setError).toHaveBeenCalledWith('name', {
				type: 'custom',
				message: 'Error'
			});
			expect(onSetError).not.toHaveBeenCalled();
		});
	});

	describe('Real-world API Error Examples', () => {
		it('should handle config validation error with messages object', () => {
			const { setError, onSetError, handle } = createMockFormHandle();

			setErrorsOnForm<TestFormData>(
				{
					status: 400,
					data: {
						messages: {
							name: ["Report configuration 'report' already exist for default"]
						}
					}
				},
				{ handle, onSetError }
			);

			expect(setError).toHaveBeenCalledWith('name', {
				type: 'custom',
				message: "Report configuration 'report' already exist for default"
			});
		});

		it('should handle password validation error with messages object', () => {
			const { setError, onSetError, handle } = createMockFormHandle();

			setErrorsOnForm<TestFormData>(
				{
					status: 400,
					data: { messages: { current_password: ['Invalid password'] } }
				},
				{ handle, onSetError }
			);

			expect(setError).toHaveBeenCalledWith('current_password', {
				type: 'custom',
				message: 'Invalid password'
			});
		});

		it('should handle global config name validation', () => {
			const { setError, onSetError, handle } = createMockFormHandle();

			setErrorsOnForm<TestFormData>(
				{
					status: 400,
					data: {
						messages: {
							name: [
								"Unsupported global configuration name. Possible are: ['per_conf', 'references', 'meta']."
							]
						}
					}
				},
				{ handle, onSetError }
			);

			expect(setError).toHaveBeenCalledWith('name', {
				type: 'custom',
				message:
					"Unsupported global configuration name. Possible are: ['per_conf', 'references', 'meta']."
			});
		});
	});
});
