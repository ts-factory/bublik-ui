/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { RefObject } from 'react';

import { useIntersectionObserver } from './useIntersectionObserver';

interface UseRenderWhenVisibleOptions extends IntersectionObserverInit {
	freezeOnceVisible?: boolean;
}

function useRenderWhenVisible(
	elementRef: RefObject<Element>,
	options: UseRenderWhenVisibleOptions = {}
) {
	const {
		root = null,
		rootMargin = '0px',
		threshold = 0,
		freezeOnceVisible = true
	} = options;

	const entry = useIntersectionObserver(elementRef, {
		root,
		rootMargin,
		threshold,
		freezeOnceVisible
	});

	const supportsIntersectionObserver =
		typeof window !== 'undefined' && 'IntersectionObserver' in window;

	return !supportsIntersectionObserver || Boolean(entry?.isIntersecting);
}

export { useRenderWhenVisible };
