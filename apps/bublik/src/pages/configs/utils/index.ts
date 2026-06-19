/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { z } from 'zod';
import { format } from 'date-fns';
import { Monaco } from '@monaco-editor/react';
import { DEFAULT_URI } from '../config.constants';

const ValidJsonStringSchema = z.string().refine(
	(val) => {
		try {
			JSON.parse(val);
			return true;
		} catch {
			return false;
		}
	},
	{ message: 'Invalid JSON' }
);

function formatTimeV(date: string): string {
	return `${format(new Date(date), 'MMM dd, yyyy')} at ${format(
		new Date(date),
		'HH:mm'
	)}`;
}

function isValidJson(jsonStr: string): boolean {
	try {
		JSON.parse(jsonStr);
		return true;
	} catch (error) {
		return false;
	}
}

function getEditorValue(monaco?: Monaco, uri = DEFAULT_URI): string {
	if (!monaco) {
		return '';
	}

	const URI = monaco.Uri.parse(uri);

	if (!URI) {
		return '';
	}

	return monaco.editor.getModel(URI)?.getValue() ?? '';
}

interface ComparableConfigForm {
	name: string;
	content: string;
	description?: string;
	is_active: boolean;
}

/**
 * Whether the edited form differs from the server config.
 *
 * Compares field by field instead of `JSON.stringify`-ing the whole form
 * object: a plain stringify is sensitive to key order, and the form's seeded
 * values and the server defaults are built with different key orders, which
 * made the comparison report "modified" even when the values were identical.
 */
function isConfigModified(
	form: ComparableConfigForm,
	server: ComparableConfigForm
): boolean {
	return (
		form.name !== server.name ||
		(form.description ?? '') !== (server.description ?? '') ||
		form.is_active !== server.is_active ||
		form.content !== server.content
	);
}

function normalizeJsonEditorContent(
	value: unknown,
	fallback = '{\n \n}'
): string {
	if (typeof value === 'string') {
		return value;
	}

	if (value === undefined) {
		return fallback;
	}

	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return fallback;
	}
}

export {
	formatTimeV,
	isValidJson,
	getEditorValue,
	isConfigModified,
	normalizeJsonEditorContent,
	ValidJsonStringSchema
};
