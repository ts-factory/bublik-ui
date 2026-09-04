/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useCallback, useState } from 'react';

export function useLazyDialog(): [boolean | null, (next: boolean) => void] {
	const [open, setOpen] = useState<boolean | null>(null);

	return [open, useCallback((next: boolean) => setOpen(next), [])];
}
