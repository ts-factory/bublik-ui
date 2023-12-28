/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef, useCallback } from 'react';

export const useSmoothScroll = () => {
	const listOuterRef = useRef<HTMLElement>(null);

	const scrollTo = useCallback((scrollOffset: number) => {
		listOuterRef.current?.scrollTo({
			left: 0,
			top: scrollOffset,
			behavior: 'smooth'
		});
	}, []);

	return {
		scrollableRef: listOuterRef,
		scrollTo
	};
};
