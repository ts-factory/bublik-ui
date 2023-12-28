/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';

export const useLocalStorage = <T>(key: string, initialValue: T) => {
	const [storedValue, setStoredValue] = useState<T>(() => {
		try {
			const item = window.localStorage.getItem(key);

			return item ? JSON.parse(item) : initialValue;
		} catch (error) {
			console.log(error);

			return initialValue;
		}
	});

	const setValue = (value: T | ((val: T) => T)) => {
		try {
			const valueToStore =
				value instanceof Function ? value(storedValue) : value;

			setStoredValue(valueToStore);

			localStorage.setItem(key, JSON.stringify(valueToStore));
		} catch (error) {
			console.log(error);
		}
	};

	return [storedValue, setValue] as const;
};

export default useLocalStorage;
