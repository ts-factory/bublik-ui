/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef, useEffect, useState } from 'react';

export function useHorizontalScroll(enabled = true) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [isHorizontalScrollEnabled, setIsHorizontalScrollEnabled] =
		useState(enabled);

	useEffect(() => {
		const scrollElement = scrollRef.current;

		const onWheel = (e: WheelEvent) => {
			if (isHorizontalScrollEnabled) {
				if (e.deltaY === 0) return;
				e.preventDefault();

				scrollElement?.scrollTo({ left: scrollElement.scrollLeft + e.deltaY });
			}
		};

		if (scrollElement) scrollElement.addEventListener('wheel', onWheel);
		return () => scrollElement?.removeEventListener('wheel', onWheel);
	}, [isHorizontalScrollEnabled]);

	return { scrollRef, setIsHorizontalScrollEnabled };
}
