/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useEffect, useRef, useState } from 'react';

export const useScrollToTopPage = (offset: number) => {
	const [isVisible, setIsVisible] = useState(false);
	const lastScrollPosition = useRef<number | null>(null);

	const handleScroll = useCallback(() => {
		const y = window.scrollY;

		lastScrollPosition.current && y < lastScrollPosition.current && y > offset
			? setIsVisible(true)
			: setIsVisible(false);

		lastScrollPosition.current = y;
	}, [offset]);

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth'
		});
	};

	useEffect(() => {
		window.addEventListener('scroll', handleScroll);

		return () => window.removeEventListener('scroll', handleScroll);
	}, [handleScroll]);

	return { scrollToTop, isVisible };
};
