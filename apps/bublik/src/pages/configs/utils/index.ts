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

export { formatTimeV, isValidJson, getEditorValue, ValidJsonStringSchema };
