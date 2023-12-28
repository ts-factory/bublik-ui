/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { RefObject, useCallback, useEffect, useState } from 'react';

export interface UseScrollToTopConfig {
	scrollRef: RefObject<HTMLElement>;
	offset: number;
}

export const useScrollToTop = (config: UseScrollToTopConfig) => {
	const { scrollRef, offset } = config;
	const [isVisible, setIsVisible] = useState(false);

	const handleScroll = useCallback(() => {
		const scrollComponent = scrollRef.current;
		if (!scrollComponent) return;

		const getScrolledHeight = () => {
			const scrolledHeight = scrollComponent.scrollTop;
			return scrolledHeight;
		};

		getScrolledHeight() > offset ? setIsVisible(true) : setIsVisible(false);
	}, [offset, scrollRef]);

	const scrollToTop = () => {
		const scrollEl = scrollRef.current;
		if (!scrollEl) return;

		scrollEl.scrollTo({ behavior: 'smooth', top: 0 });
	};

	useEffect(() => {
		const scrollEl = scrollRef.current;

		if (!scrollEl) return;

		scrollEl.addEventListener('scroll', handleScroll);

		return () => scrollEl.removeEventListener('scroll', handleScroll);
	}, [handleScroll, scrollRef]);

	return { isVisible, scrollToTop };
};
