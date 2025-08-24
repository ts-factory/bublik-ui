/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { HTTP_CODE_DESCRIPTIONS, HTTP_CODE_TO_ERROR_MAP } from './constants';
import {
	isHttpError,
	isFetchError,
	isParsingError,
	isTimeoutError,
	isCustomError,
	isBublikApiCustomError,
	isBublikError,
	isBublikAuthError,
	isHistoryParsingError,
	BublikError,
	isValidationError
} from './validation';

export const createBublikError = (config: BublikError): BublikError => config;

/**
 * Retrieve error description from HTTP code or custom error
 * provided error title and description will overwrite default from HTTP code
 */
export const getErrorMessage = (error: unknown): BublikError => {
	if (isBublikError(error)) {
		return error;
	}

	if (isValidationError(error)) {
		return {
			status: 400,
			title: error.data.type,
			description: Object.entries(error.data.message)
				.map(([field, error]) => `${field}: ${error}`)
				.join('\n')
		};
	}

	if (isHistoryParsingError(error)) {
		return {
			status: 400,
			title: error.data.type,
			description: error.data.message?.[0] ?? 'Unknown error'
		};
	}

	if (isBublikApiCustomError(error)) {
		const {
			status,
			data: { type, message }
		} = error;

		return { title: type, status, description: message };
	}

	if (isHttpError(error)) {
		const { status, data } = error;

		return {
			status,
			title: HTTP_CODE_TO_ERROR_MAP.get(status) ?? 'Unknown error',
			description:
				typeof data === 'string'
					? data
					: HTTP_CODE_DESCRIPTIONS.get(status) ?? ''
		};
	}

	if (isBublikAuthError(error)) {
		return {
			status: error.status,
			title: 'Authorization error',
			description: error.data.message
		};
	}

	if (isFetchError(error)) {
		return {
			status: error.status,
			title: 'Fetch error',
			description:
				'An error that occurred during execution of `fetch` or the `fetchFn` callback option'
		};
	}

	if (isParsingError(error)) {
		return {
			status: error.status,
			title: 'Parsing error',
			description: 'An error that occurred during parsing of the response body'
		};
	}

	if (isTimeoutError(error)) {
		return {
			status: error.status,
			title: 'Timeout error',
			description: 'An error that occurred when the request timed out'
		};
	}

	if (isCustomError(error)) {
		return {
			status: error.status,
			title: 'Custom error',
			description: 'An error that occurred when the request timed out'
		};
	}

	return {
		status: 'UNKNOWN_ERROR',
		title: 'Unknown error',
		description: 'Unknown error'
	};
};

export * from './validation';
