/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
// No imports: `latest-read.unit.ts` runs this file under plain Node.

/**
 * A read remembered for the latest key only: the same key reuses the pending
 * or settled read, a new key replaces it. A failed read is forgotten, so the
 * next call tries again; the failure of a read already replaced changes
 * nothing.
 */
function latestRead<V>(): (key: string, read: () => Promise<V>) => Promise<V> {
	let latest: { key: string; value: Promise<V> } | undefined;

	return (key, read) => {
		if (latest?.key === key) return latest.value;

		const entry = { key, value: read() };
		latest = entry;
		entry.value.catch(() => {
			if (latest === entry) latest = undefined;
		});

		return entry.value;
	};
}

export { latestRead };
