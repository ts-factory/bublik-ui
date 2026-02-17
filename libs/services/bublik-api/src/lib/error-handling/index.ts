/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { z } from 'zod';
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
	isValidationError,
	isUnifiedError
} from './validation';

export const createBublikError = (config: BublikError): BublikError => config;

const normalizeUnifiedMessages = (
	messages: string | string[] | Record<string, string | string[]>
): string[] => {
	if (typeof messages === 'string') {
		return [messages];
	}

	if (Array.isArray(messages)) {
		return messages;
	}

	return Object.entries(messages).flatMap(([field, value]) => {
		if (Array.isArray(value)) {
			return value.map((message) => `${field}: ${message}`);
		}

		return [`${field}: ${value}`];
	});
};

export const getErrorDetails = (error: unknown): string[] => {
	if (isUnifiedError(error)) {
		return normalizeUnifiedMessages(error.data.messages);
	}

	if (isValidationError(error)) {
		return Object.entries(error.data.message).flatMap(([field, messages]) =>
			messages.map((message) => `${field}: ${message}`)
		);
	}

	if (isHistoryParsingError(error)) {
		return error.data.message;
	}

	if (isBublikApiCustomError(error)) {
		return [error.data.message];
	}

	if (isBublikAuthError(error)) {
		return [error.data.message];
	}

	if (isBublikError(error)) {
		return error.description
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean);
	}

	return [];
};

export interface BublikErrorViewModel extends BublikError {
	details: string[];
}

export const getErrorViewModel = (error: unknown): BublikErrorViewModel => {
	const details = getErrorDetails(error);

	return {
		...getErrorMessage(error),
		details
	};
};

const ZodErrorSchema = z.object({
	name: z.literal('SchemaError'),
	message: z.string()
});

function isZodError(error: unknown): error is z.infer<typeof ZodErrorSchema> {
	return ZodErrorSchema.safeParse(error).success;
}

/**
 * Retrieve error description from HTTP code or custom error
 * provided error title and description will overwrite default from HTTP code
 */
export const getErrorMessage = (error: unknown): BublikError => {
	if (isBublikError(error)) {
		return error;
	}

	if (isUnifiedError(error)) {
		const { status, data } = error;
		const messages = data.messages;
		const details = normalizeUnifiedMessages(messages);

		let description: string;
		let title: string;

		if (Array.isArray(messages)) {
			title = 'Error';
			description = details.join(', ');
		} else if (typeof messages === 'string') {
			title = 'Error';
			description = messages;
		} else {
			title = 'Validation error';
			description = details.join('\n');
		}

		return {
			status: typeof status === 'number' ? status : parseInt(status, 10) || 500,
			title,
			description
		};
	}

	if (isZodError(error)) {
		return {
			status: 400,
			title: 'Validation error',
			description: error.message
		};
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
