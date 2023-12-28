/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { RefObject, useEffect, useState } from 'react';

export interface UseIsStickyOptions {
	offset?: number;
}

export const useIsSticky = (
	ref: RefObject<HTMLElement>,
	options: UseIsStickyOptions = {}
) => {
	const [isSticky, setIsSticky] = useState(false);

	useEffect(() => {
		const offset = options.offset ?? -1;
		const el = ref.current;

		if (!el) return;

		const observer = new IntersectionObserver(
			([e]) => {
				if (e.intersectionRatio < 1) {
					setIsSticky(true);
				} else {
					setIsSticky(false);
				}
			},
			{
				rootMargin: `${offset}px 0px 0px 0px`,
				threshold: [1]
			}
		);

		observer.observe(el);
		return () => observer.unobserve(el);
	}, [ref, options.offset]);

	return { isSticky };
};
