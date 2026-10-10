/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect, useState } from 'react';

/** How long a picker waits after the last keystroke before searching. */
export const PICKER_SEARCH_DEBOUNCE_MS = 250;

export function useDebouncedValue<T>(value: T, delayMs: number): T {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const id = setTimeout(() => setDebounced(value), delayMs);

		return () => clearTimeout(id);
	}, [value, delayMs]);

	return debounced;
}
