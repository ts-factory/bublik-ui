/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
	window.addEventListener('online', callback);
	window.addEventListener('offline', callback);
	return () => {
		window.removeEventListener('online', callback);
		window.removeEventListener('offline', callback);
	};
}

export const useIsOnline = () => {
	return useSyncExternalStore(
		subscribe,
		() => navigator.onLine,
		() => true
	);
};
