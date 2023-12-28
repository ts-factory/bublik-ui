/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect, useState } from 'react';

export const useDebounce = <T>(value: T, delay: number) => {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const timerId = setTimeout(() => setDebouncedValue(value), delay);

		return () => clearTimeout(timerId);
	}, [delay, value]);

	return debouncedValue;
};
