/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect, useState } from 'react';

export interface UseIsTimedOutConfig {
	seconds: number;
}

export const useIsTimedOut = ({ seconds }: UseIsTimedOutConfig) => {
	const [isTimedOut, setIsTimedOut] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setIsTimedOut(true), seconds * 1000);
		return () => clearTimeout(timer);
	}, [seconds]);

	return isTimedOut;
};
