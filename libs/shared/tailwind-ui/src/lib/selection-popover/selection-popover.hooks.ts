/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback } from 'react';

import { useLocalStorage } from '@/shared/hooks';

function setSelectionPopoverOpenState(storageKey: string, open: boolean) {
	if (typeof window === 'undefined') return;

	window.localStorage.setItem(storageKey, JSON.stringify(open));
	window.dispatchEvent(new StorageEvent('storage', { key: storageKey }));
}

function resetSelectionPopoverOpenState(storageKey: string) {
	setSelectionPopoverOpenState(storageKey, true);
}

function useSelectionPopoverOpenState(storageKey: string) {
	const [open, setOpen] = useLocalStorage(storageKey, true);

	const onOpenChange = useCallback(
		(nextOpen: boolean) => {
			setOpen(nextOpen);
		},
		[setOpen]
	);

	const resetOpenState = useCallback(() => {
		setOpen(true);
	}, [setOpen]);

	return { open, onOpenChange, resetOpenState };
}

export {
	resetSelectionPopoverOpenState,
	setSelectionPopoverOpenState,
	useSelectionPopoverOpenState
};
