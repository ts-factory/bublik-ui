/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */

/**
 * A bug key is stored as the URI `ref://TRACKER/KEY`, but nobody should have to
 * type a URI scheme into a form. The drawer collects the two halves separately
 * and joins them here, which keeps the shape the backend validates
 * (`BUG_KEY_VALIDATOR` in `bublik/data/models/issue.py`, built from `REF_CORE`
 * in `bublik/core/references.py`) in exactly one place on this side.
 */

/** `REF_CORE` group 1 — the tracker name. Anything but whitespace and `/`. */
export const TRACKER_RE = /^[^/\s]+$/;

/** `REF_CORE` group 2 — the key within that tracker. */
export const BUG_KEY_RE = /^[\w\-/:]+$/;

const REF_PREFIX = 'ref://';

/**
 * Joins the two halves into the stored form. Both blank means "no bug key",
 * which is a valid answer — the field is optional.
 */
export function composeBugKey(
	tracker: string | undefined,
	key: string | undefined
): string | undefined {
	const t = tracker?.trim();
	const k = key?.trim();

	if (!t || !k) return undefined;

	return `${REF_PREFIX}${t}/${k}`;
}

/**
 * The inverse, for text that arrives whole rather than in two fields — someone
 * pasting `ref://JIRA/FOO-123` copied from a badge, or the bare `JIRA/FOO-123`.
 * Returns null when the text is not a tracker/key pair, in which case it is
 * just a key and belongs in the key field as typed.
 *
 * A key may itself contain `/` — `REF_CORE` allows it — so `FOO/123` is
 * genuinely ambiguous. Without the `ref://` scheme to settle it, the split only
 * happens when the leading segment is a tracker we have actually seen; that is
 * what `knownTrackers` is for.
 */
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

/**
 * The four rules every bug-key field pair obeys, in one place.
 *
 * Both halves are optional — an issue without a tracker reference is fine — but
 * half of one is not a bug key, and `composeBugKey` would silently drop it. The
 * classify drawer and the issue drawer both collect the pair, so they both
 * refine it through here rather than restating the messages.
 *
 * Takes zod's context rather than returning a schema: the shapes around it
 * differ (classify only validates these under `mode === 'new'`), so the caller
 * decides when to run it.
 */
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

	if (tracker && !bugKey) {
		ctx.addIssue({
			code: 'custom',
			path: ['bugKey'],
			message: 'Enter a bug key'
		});
	}
}
