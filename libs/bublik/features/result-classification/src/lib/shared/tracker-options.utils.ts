/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { splitBugKey } from './bug-key.utils';

/**
 * The Tracker field's option list.
 *
 * `configured` is the project's `REFERENCES.ISSUES` block and comes first, in
 * config order, because that is the list a project owner curated. Trackers that
 * only show up on existing bug keys are appended rather than dropped: an issue
 * whose key predates the config still has to render, and its tracker still has
 * to be pickable when someone edits it.
 */
export function mergeTrackerOptions(
	configured: readonly string[],
	bugKeys: readonly (string | null | undefined)[]
): string[] {
	const used = new Set<string>();

	bugKeys.forEach((key) => {
		const split = key ? splitBugKey(key) : null;

		if (split && !configured.includes(split.tracker)) used.add(split.tracker);
	});

	return [...configured, ...[...used].sort((a, b) => a.localeCompare(b))];
}
