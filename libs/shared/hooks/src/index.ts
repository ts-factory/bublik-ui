/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef, useState, useEffect } from 'react';

export {
	useMount,
	useLifecycles,
	useUnmount,
	usePrevious,
	useKeyPressEvent,
	useKey,
	useMeasure,
	useIntersection
} from 'react-use';

export * from './lib/useDebounce';
export * from './lib/useLocalStorage';
export * from './lib/useSmoothScroll';
export * from './lib/useForceRerender';
export * from './lib/useDocumentTitle';
export * from './lib/usePagination';
export * from './lib/useHorizontalScroll';
export * from './lib/useInterval';
export * from './lib/useTimeout';
export * from './lib/useScrollToTop';
export * from './lib/useScrollToTopPage';
export * from './lib/useClipboard';
export * from './lib/useHideHeader';
export * from './lib/useIsTimedOut';
export * from './lib/useToggle';
export * from './lib/useIntersectionObserver';
export * from './lib/useClickOutside';
export * from './lib/useConfirm';
export * from './lib/useIsSticky';
export * from './lib/useKeyPress';
export * from './lib/useIsOnline';
export * from './lib/use-controllable-state';
export * from './lib/use-ctrl-pressed';
export * from './lib/use-physical-hotkeys';
export * from './lib/use-page-container';
export * from './lib/use-render-when-visible';
export * from './lib/use-progressive-visible-count';

/**
 * Whether the element the ref is attached to currently overflows vertically.
 *
 * Watches the content as well as the box. A `ResizeObserver` on the scroller
 * alone only fires when the *scroller* is resized, which in a fixed-height
 * panel — a drawer, a sidebar — is never: the thing that changes is what is
 * inside it. Anything whose content arrives or grows after mount (an async
 * option list, a form that swaps fields between create and edit mode) would
 * measure once while it was still short and report `false` for good.
 *
 * So the observer is pointed at the children too, and a `MutationObserver`
 * re-points it when the child list changes.
 */
export const useIsScrollbarVisible = <T extends HTMLElement>() => {
	const ref = useRef<T>(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const element = ref.current;

		if (!element) return;

		const measure = () =>
			setIsVisible(element.scrollHeight > element.clientHeight);

		const resizeObserver = new ResizeObserver(measure);

		// Re-observe from scratch: children come and go, and an observer left
		// pointing at a removed node keeps it alive for nothing.
		const observeAll = () => {
			resizeObserver.disconnect();
			resizeObserver.observe(element);
			for (const child of Array.from(element.children)) {
				resizeObserver.observe(child);
			}
			measure();
		};

		const mutationObserver = new MutationObserver(observeAll);

		observeAll();
		mutationObserver.observe(element, { childList: true, subtree: false });

		return () => {
			resizeObserver.disconnect();
			mutationObserver.disconnect();
		};
	}, []);

	return [ref, isVisible] as const;
};
