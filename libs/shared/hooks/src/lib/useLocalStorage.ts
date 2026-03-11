/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useSyncExternalStore } from 'react';

const LOCAL_STORAGE_CHANGE_EVENT = 'local-storage-change';
const localStorageSnapshotCache = new Map<
	string,
	{ rawValue: string | null; parsedValue: unknown }
>();

const readLocalStorageValue = <T>(key: string, initialValue: T): T => {
	try {
		const rawValue = window.localStorage.getItem(key);
		const cachedValue = localStorageSnapshotCache.get(key);

		if (cachedValue && cachedValue.rawValue === rawValue) {
			return cachedValue.parsedValue as T;
		}

		const parsedValue = rawValue ? JSON.parse(rawValue) : initialValue;

		localStorageSnapshotCache.set(key, { rawValue, parsedValue });

		return parsedValue;
	} catch (error) {
		console.log(error);

		localStorageSnapshotCache.set(key, {
			rawValue: null,
			parsedValue: initialValue
		});

		return initialValue;
	}
};

const dispatchLocalStorageChange = (key: string) => {
	window.dispatchEvent(
		new CustomEvent(LOCAL_STORAGE_CHANGE_EVENT, {
			detail: { key }
		})
	);
};

const isStorageEventForKey = (event: Event, key: string) =>
	event instanceof StorageEvent && (!event.key || event.key === key);

const isLocalStorageChangeEventForKey = (event: Event, key: string) =>
	event instanceof CustomEvent &&
	event.detail &&
	typeof event.detail === 'object' &&
	'key' in event.detail &&
	event.detail.key === key;

export const useLocalStorage = <T>(key: string, initialValue: T) => {
	const subscribe = useCallback(
		(onStoreChange: () => void) => {
			const handleStorageChange = (event: Event) => {
				if (
					!isStorageEventForKey(event, key) &&
					!isLocalStorageChangeEventForKey(event, key)
				) {
					return;
				}

				onStoreChange();
			};

			window.addEventListener('storage', handleStorageChange);
			window.addEventListener(LOCAL_STORAGE_CHANGE_EVENT, handleStorageChange);

			return () => {
				window.removeEventListener('storage', handleStorageChange);
				window.removeEventListener(
					LOCAL_STORAGE_CHANGE_EVENT,
					handleStorageChange
				);
			};
		},
		[key]
	);

	const getSnapshot = useCallback(
		() => readLocalStorageValue(key, initialValue),
		[initialValue, key]
	);
	const storedValue = useSyncExternalStore(
		subscribe,
		getSnapshot,
		() => initialValue
	);

	const setValue = (value: T | ((val: T) => T)) => {
		try {
			const valueToStore =
				value instanceof Function
					? value(readLocalStorageValue(key, initialValue))
					: value;
			const rawValue = JSON.stringify(valueToStore);

			localStorage.setItem(key, rawValue);
			localStorageSnapshotCache.set(key, {
				rawValue,
				parsedValue: valueToStore
			});
			dispatchLocalStorageChange(key);
		} catch (error) {
			console.log(error);
		}
	};

	return [storedValue, setValue] as const;
};

export default useLocalStorage;
