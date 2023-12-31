/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef, useEffect } from 'react';

const DEFAULT_EVENTS = ['mousedown', 'touchstart'];

export function useClickOutside<T extends HTMLElement = any>(
	handler: () => void,
	events?: string[] | null,
	nodes?: HTMLElement[]
) {
	const ref = useRef<T>();

	useEffect(() => {
		const listener = (event: any) => {
			if (Array.isArray(nodes)) {
				const shouldTrigger = nodes.every(
					(node) => !!node && !node.contains(event.target)
				);

				shouldTrigger && handler();
			} else if (ref.current && !ref.current.contains(event.target)) {
				handler();
			}
		};

		(events || DEFAULT_EVENTS).forEach((fn) =>
			document.addEventListener(fn, listener)
		);

		return () => {
			(events || DEFAULT_EVENTS).forEach((fn) =>
				document.removeEventListener(fn, listener)
			);
		};
	}, [ref, handler, nodes, events]);

	return ref;
}
