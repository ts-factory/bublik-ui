/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */

/**
 * One row of the headers editor.
 *
 * `existing` marks a header the server already stores. Its value is never
 * shown, so the row starts blank and a blank value on submit means "keep
 * what is stored".
 */
export interface HeaderRow {
	name: string;
	value: string;
	existing: boolean;
}

/** The rows the edit form starts from: every stored header, value withheld. */
export const namesToRows = (names: string[]): HeaderRow[] =>
	names.map((name) => ({ name, value: '', existing: true }));

/** The full mapping a creation sends. */
export const rowsToCreateMap = (rows: HeaderRow[]): Record<string, string> =>
	Object.fromEntries(rows.map((row) => [row.name.trim(), row.value]));

/**
 * The merge patch an edit sends: a removed stored header becomes `null`, a
 * stored header left blank is omitted (kept), everything else is set.
 */
export const rowsToPatchMap = (
	rows: HeaderRow[],
	originalNames: string[]
): Record<string, string | null> => {
	const patch: Record<string, string | null> = {};
	const kept = new Set(rows.filter((row) => row.existing).map((r) => r.name));

	for (const name of originalNames) {
		if (!kept.has(name)) patch[name] = null;
	}

	for (const row of rows) {
		if (row.existing && row.value === '') continue;
		patch[row.name.trim()] = row.value;
	}

	return patch;
};
