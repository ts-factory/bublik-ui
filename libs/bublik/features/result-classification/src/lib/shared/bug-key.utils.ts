/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */

export const TRACKER_RE = /^[^/\s]+$/;

export const BUG_KEY_RE = /^[\w\-/:]+$/;

const REF_PREFIX = 'ref://';

export function composeBugKey(
	tracker: string | undefined,
	key: string | undefined
): string | undefined {
	const t = tracker?.trim();
	const k = key?.trim();

	if (!t || !k) return undefined;

	return `${REF_PREFIX}${t}/${k}`;
}

export function splitBugKey(
	value: string,
	knownTrackers: readonly string[] = []
): { tracker: string; key: string } | null {
	const trimmed = value.trim();
	const hasScheme = trimmed.startsWith(REF_PREFIX);
	const withoutScheme = hasScheme ? trimmed.slice(REF_PREFIX.length) : trimmed;

	const separator = withoutScheme.indexOf('/');

	if (separator <= 0) return null;

	const tracker = withoutScheme.slice(0, separator);
	const key = withoutScheme.slice(separator + 1);

	if (!TRACKER_RE.test(tracker) || !BUG_KEY_RE.test(key)) return null;

	if (!hasScheme && !knownTrackers.includes(tracker)) return null;

	return { tracker, key };
}

export function refineBugKeyHalves(
	values: { tracker?: string; bugKey?: string },
	ctx: {
		addIssue: (issue: {
			code: 'custom';
			path: (string | number)[];
			message: string;
		}) => void;
	}
): void {
	const tracker = values.tracker?.trim() ?? '';
	const bugKey = values.bugKey?.trim() ?? '';

	if (tracker && !TRACKER_RE.test(tracker)) {
		ctx.addIssue({
			code: 'custom',
			path: ['tracker'],
			message: 'Tracker cannot contain spaces or "/"'
		});
	}

	if (bugKey && !BUG_KEY_RE.test(bugKey)) {
		ctx.addIssue({
			code: 'custom',
			path: ['bugKey'],
			message: 'Bug key can only contain letters, digits and - _ / :'
		});
	}

	if (bugKey && !tracker) {
		ctx.addIssue({
			code: 'custom',
			path: ['tracker'],
			message: 'Choose a tracker'
		});
	}
}
