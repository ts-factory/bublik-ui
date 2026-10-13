/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { mergeTrackerOptions } from './tracker-options.utils';

describe('mergeTrackerOptions', () => {
	it('keeps the configured trackers in config order, ahead of everything else', () => {
		expect(
			mergeTrackerOptions(
				['BUGZILLA', 'JIRA'],
				['ref://JIRA/FOO-123', 'ref://LEGACY/OLD-1']
			)
		).toEqual(['BUGZILLA', 'JIRA', 'LEGACY']);
	});

	it('appends unconfigured trackers sorted, so an old bug key stays pickable', () => {
		expect(
			mergeTrackerOptions([], ['ref://ZULIP/Z-1', 'ref://ACME/A-1'])
		).toEqual(['ACME', 'ZULIP']);
	});

	it('does not repeat a tracker that is both configured and in use', () => {
		expect(
			mergeTrackerOptions(['JIRA'], ['ref://JIRA/FOO-1', 'ref://JIRA/FOO-2'])
		).toEqual(['JIRA']);
	});

	it('ignores keys that are missing or not a reference', () => {
		expect(
			mergeTrackerOptions(['JIRA'], [null, undefined, '', 'FOO-123'])
		).toEqual(['JIRA']);
	});

	it('is just the config when no issue carries a key', () => {
		expect(mergeTrackerOptions(['JIRA'], [])).toEqual(['JIRA']);
	});
});
