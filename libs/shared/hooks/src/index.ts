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
export * from './lib/use-page-container';
export * from './lib/use-render-when-visible';
export * from './lib/use-progressive-visible-count';

export const useIsScrollbarVisible = <T extends HTMLElement>() => {
	const ref = useRef<T>(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		if (!ref.current) return;

		const resizeObserver = new ResizeObserver((entries) => {
			const entry = entries?.[0];

			if (!entry) return;

			const element = entry.target;

			if (element.scrollHeight > element.clientHeight) {
				setIsVisible(true);
			} else {
				setIsVisible(false);
			}
		});

		resizeObserver.observe(ref.current);
		return () => resizeObserver.disconnect();
	}, []);

	return [ref, isVisible] as const;
};
