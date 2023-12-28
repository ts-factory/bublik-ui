/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect, useLayoutEffect, useRef } from 'react';

export const useTimeout = (callback: () => void, delay: number | null) => {
	const savedCallback = useRef(callback);

	// Remember the latest callback if it changes.
	useLayoutEffect(() => {
		savedCallback.current = callback;
	}, [callback]);

	// Set up the timeout.
	useEffect(() => {
		// Don't schedule if no delay is specified.
		if (!delay) {
			return;
		}

		const id = setTimeout(() => savedCallback.current(), delay);

		return () => clearTimeout(id);
	}, [delay]);
};
