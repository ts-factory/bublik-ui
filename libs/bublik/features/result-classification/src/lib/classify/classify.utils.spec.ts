/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it, vi } from 'vitest';
import type { UseFormReturn } from 'react-hook-form';

import {
	ClassifyRequestError,
	applyClassifyErrors,
	classifyErrorText,
	flattenMessages
} from './classify.utils';
import type {
	ClassifyForm,
	ClassifyFormValues
} from './classify-form.component';

function createForm(mode: ClassifyFormValues['mode'] = 'new') {
	const setError = vi.fn();
	const form = {
		setError,
		getValues: vi.fn(() => mode)
	} as unknown as ClassifyForm & UseFormReturn<ClassifyFormValues>;

	return { form, setError };
}

const BUG_KEY_ERROR = {
	status: 400,
	data: {
		messages: {
			issue: { bug_key: ['Bug key must be in ref://TRACKER/KEY form.'] }
		}
	}
};

describe('flattenMessages', () => {
	it('walks nested dicts into dotted paths', () => {
		expect(flattenMessages(BUG_KEY_ERROR.data.messages)).toEqual([
			{
				path: 'issue.bug_key',
				message: 'Bug key must be in ref://TRACKER/KEY form.'
			}
		]);
	});

	it('keeps only the first message of a list', () => {
		expect(flattenMessages({ title: ['first', 'second'] })).toEqual([
			{ path: 'title', message: 'first' }
		]);
	});

	it('drops empty lists', () => {
		expect(flattenMessages({ title: [] })).toEqual([]);
	});

	it('handles a bare list — the shape with no field at all', () => {
		expect(flattenMessages(['Unexpected server error.'])).toEqual([
			{ path: '', message: 'Unexpected server error.' }
		]);
	});
});

describe('applyClassifyErrors', () => {
	it('puts the nested bug_key error on the bug key field', () => {
		const { form, setError } = createForm();

		applyClassifyErrors(BUG_KEY_ERROR, form);

		expect(setError).toHaveBeenCalledWith('bugKey', {
			type: 'custom',
			message: 'Bug key must be in ref://TRACKER/KEY form.'
		});
		expect(setError).toHaveBeenCalledTimes(1);
	});

	it('maps the nested title error', () => {
		const { form, setError } = createForm();

		applyClassifyErrors(
			{ status: 400, data: { messages: { issue: { title: ['Required.'] } } } },
			form
		);

		expect(setError).toHaveBeenCalledWith('title', {
			type: 'custom',
			message: 'Required.'
		});
	});

	it('sends a bare issue error to the picker under "existing"', () => {
		const { form, setError } = createForm('existing');

		applyClassifyErrors(
			{ status: 400, data: { messages: { issue: ['No such issue.'] } } },
			form
		);

		expect(setError).toHaveBeenCalledWith('issueId', {
			type: 'custom',
			message: 'No such issue.'
		});
	});

	it('sends a bare issue error to root under "new" — no field owns it', () => {
		const { form, setError } = createForm('new');

		applyClassifyErrors(
			{ status: 400, data: { messages: { issue: ['Invalid payload.'] } } },
			form
		);

		expect(setError).toHaveBeenCalledWith('root', {
			type: 'custom',
			message: 'Issue: Invalid payload.'
		});
	});

	it('sends a field-less list to root', () => {
		const { form, setError } = createForm();

		applyClassifyErrors(
			{ status: 400, data: { messages: ['Select a project first.'] } },
			form
		);

		expect(setError).toHaveBeenCalledWith('root', {
			type: 'custom',
			message: 'Select a project first.'
		});
	});

	it('sends matcher errors to root, keeping the path visible', () => {
		const { form, setError } = createForm();

		applyClassifyErrors(
			{
				status: 400,
				data: { messages: { matcher: { match_verdicts: ['Must be a bool.'] } } }
			},
			form
		);

		expect(setError).toHaveBeenCalledWith('root', {
			type: 'custom',
			message: 'matcher.match_verdicts: Must be a bool.'
		});
	});

	it('splits mixed errors between the field and root', () => {
		const { form, setError } = createForm();

		applyClassifyErrors(
			{
				status: 400,
				data: {
					messages: {
						issue: { bug_key: ['Bad key.'] },
						matcher: ['Bad matcher.']
					}
				}
			},
			form
		);

		expect(setError).toHaveBeenCalledWith('bugKey', {
			type: 'custom',
			message: 'Bad key.'
		});
		expect(setError).toHaveBeenCalledWith('root', {
			type: 'custom',
			message: 'matcher: Bad matcher.'
		});
	});

	it('renders a locally raised failure through the same path', () => {
		const { form, setError } = createForm();

		applyClassifyErrors(
			new ClassifyRequestError('Select a project first.'),
			form
		);

		expect(setError).toHaveBeenCalledWith('root', {
			type: 'custom',
			message: 'Select a project first.'
		});
	});

	it('falls back to the shared helper for shapes it does not model', () => {
		const { form, setError } = createForm();

		applyClassifyErrors({ status: 400, data: 'Something broke' }, form);

		expect(setError).toHaveBeenCalledWith('root', {
			type: 'custom',
			message: 'Something broke'
		});
	});

	it('falls back for a transport failure', () => {
		const { form, setError } = createForm();

		applyClassifyErrors({ status: 'FETCH_ERROR', error: 'boom' }, form);

		expect(setError).toHaveBeenCalledWith('root', {
			message: 'Unknown error!'
		});
	});
});

describe('classifyErrorText', () => {
	it('names the field the message belongs to', () => {
		expect(classifyErrorText(BUG_KEY_ERROR)).toBe(
			'Bug key: Bug key must be in ref://TRACKER/KEY form.'
		);
	});

	it('joins several messages onto their own lines', () => {
		expect(
			classifyErrorText({
				status: 400,
				data: {
					messages: { issue: { title: ['Required.'], bug_key: ['Bad key.'] } }
				}
			})
		).toBe('Title: Required.\nBug key: Bad key.');
	});

	it('falls back to getErrorMessage for an unmodelled shape', () => {
		expect(classifyErrorText({ status: 500, data: undefined })).toContain(
			'Internal server error'
		);
	});
});
