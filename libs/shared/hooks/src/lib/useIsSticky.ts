/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { RefObject, useEffect, useState } from 'react';

export interface UseIsStickyOptions {
	offset?: number;
	enabled?: boolean;
	/**
	 * The scroller the element sticks inside, when it is not the viewport.
	 * Read when the observer is set up, so a ref to a parent rendered in the
	 * same commit is already filled in.
	 */
	rootRef?: RefObject<Element>;
}

export const useIsSticky = (
	ref: RefObject<HTMLElement>,
	options: UseIsStickyOptions = {}
) => {
	const [isSticky, setIsSticky] = useState(false);
	const { enabled, offset: optionsOffset, rootRef } = options;

	useEffect(() => {
		if (enabled === false) {
			setIsSticky(false);
			return;
		}

		const offset = optionsOffset ?? -1;
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
				root: rootRef?.current ?? null,
				rootMargin: `${offset}px 0px 0px 0px`,
				threshold: [1]
			}
		);

		observer.observe(el);
		return () => observer.unobserve(el);
	}, [ref, enabled, optionsOffset, rootRef]);

	return { isSticky };
};
