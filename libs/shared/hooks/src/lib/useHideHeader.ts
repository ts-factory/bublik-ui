/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState, useRef, useCallback, useEffect } from 'react';

interface UseHideHeaderConfig {
	offsetUp?: number;
	offsetDown?: number;
}

export const useHideHeader = (
	{ offsetDown = 50, offsetUp }: UseHideHeaderConfig = { offsetDown: 50 }
) => {
	const [isVisible, setIsVisible] = useState(true);
	const previousScroll = useRef<number | null>(null);

	const handleScroll = useCallback(() => {
		const currentScrollPos = window.scrollY;
		const previousScrollPosition = previousScroll.current;

		if (previousScrollPosition && previousScrollPosition > currentScrollPos) {
			setIsVisible(true);
		} else if (currentScrollPos > offsetDown) {
			setIsVisible(false);
		}

		previousScroll.current = currentScrollPos;
	}, [offsetDown]);

	useEffect(() => {
		window.addEventListener('scroll', handleScroll);

		return () => window.removeEventListener('scroll', handleScroll);
	}, [handleScroll]);

	return isVisible;
};
