/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';

interface UseDelegatedTableWheelScrollOptions {
	pageContainer: HTMLElement | null;
	isModifierPressed: boolean;
}

function useDelegatedTableWheelScroll(
	options: UseDelegatedTableWheelScrollOptions
) {
	const { pageContainer, isModifierPressed } = options;

	useEffect(() => {
		if (!pageContainer) return;

		const container = pageContainer;

		function handleWheel(event: WheelEvent) {
			if (isModifierPressed) return;

			const target = event.target;
			if (!(target instanceof Element)) return;

			const tableElement = target.closest(
				'[data-run-report-table-scroll="true"]'
			);
			if (!tableElement) return;

			container.scrollBy({
				top: event.deltaY,
				left: event.deltaX,
				behavior: 'auto'
			});

			event.preventDefault();
		}

		container.addEventListener('wheel', handleWheel, { passive: false });

		return () => {
			container.removeEventListener('wheel', handleWheel);
		};
	}, [isModifierPressed, pageContainer]);
}

export { useDelegatedTableWheelScroll };
