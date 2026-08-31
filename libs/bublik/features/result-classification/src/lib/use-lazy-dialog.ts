/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useCallback, useState } from 'react';

/**
 * Open state for a dialog that should not exist until it is first wanted.
 *
 * These controls live in table cells, and the rules table defaults to a page
 * size of 100. Rendering the drawer eagerly next to every row would mount a
 * hundred Radix roots and a hundred `useForm` instances before anyone has
 * clicked anything — all so that a single one of them can be shown.
 *
 * `null` means "never opened, do not render it at all"; after the first open it
 * is a plain boolean, so the drawer stays mounted and its close animation and
 * in-flight submit both survive. Mounting already `open` is fine: the enter
 * animation is a CSS rule on `data-state="open"`, and it plays on mount.
 *
 *     const [open, setOpen] = useLazyDialog();
 *     ...
 *     {open !== null ? <Drawer open={open} onOpenChange={setOpen} /> : null}
 */
export function useLazyDialog(): [boolean | null, (next: boolean) => void] {
	const [open, setOpen] = useState<boolean | null>(null);

	return [open, useCallback((next: boolean) => setOpen(next), [])];
}
