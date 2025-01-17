/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useEffect, useRef, useState, RefObject } from 'react';

export const useScrollToTopPage = (
	offset = 0,
	containerRef?: RefObject<HTMLElement>
) => {
	const [isVisible, setIsVisible] = useState(false);
	const [isScrollingUp, setIsScrollingUp] = useState(true);
	const lastScrollPosition = useRef<number | null>(null);

	const handleScroll = useCallback(() => {
		const container = containerRef?.current;
		const currentScroll = container ? container.scrollTop : window.scrollY;

		if (lastScrollPosition.current !== null) {
			setIsScrollingUp(currentScroll < lastScrollPosition.current);
			setIsVisible(currentScroll > offset);
		}

		lastScrollPosition.current = currentScroll;
	}, [offset, containerRef]);

	const scroll = () => {
		const container = containerRef?.current;
		const maxScroll = container
			? container.scrollHeight - container.clientHeight
			: document.documentElement.scrollHeight - window.innerHeight;

		if (container) {
			container.scrollTo({
				top: !isScrollingUp ? maxScroll : 0,
				behavior: 'smooth'
			});
		} else {
			window.scrollTo({
				top: !isScrollingUp ? maxScroll : 0,
				behavior: 'smooth'
			});
		}
	};

	useEffect(() => {
		const container = containerRef?.current;
		const target = container || window;

		target.addEventListener('scroll', handleScroll);
		return () => target.removeEventListener('scroll', handleScroll);
	}, [handleScroll, containerRef]);

	return { scroll, isVisible, isScrollingUp };
};
