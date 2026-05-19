/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { TestBlock } from '@/shared/types';

const RUN_REPORT_TABLE_OF_CONTENTS_ID = 'run-report-table-of-contents';

type ArgValNavigationDirection = 'next' | 'previous';

interface ArgValNavigationItem {
	id: string;
	label: string;
}

function getVisibleArgsValNavigationItems(
	blocks: TestBlock[]
): ArgValNavigationItem[] {
	return blocks.flatMap((block) =>
		block.content
			.filter((argsValBlock) => argsValBlock.label.trim().length > 0)
			.map((argsValBlock) => ({
				id: argsValBlock.id,
				label: argsValBlock.label
			}))
	);
}

function getArgsValNavigationTarget(
	items: ArgValNavigationItem[],
	currentId: string,
	direction: ArgValNavigationDirection
): ArgValNavigationItem | undefined {
	const currentIndex = items.findIndex((item) => item.id === currentId);

	if (currentIndex === -1) {
		return undefined;
	}

	const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

	return items[nextIndex];
}

function getCurrentArgsValNavigationItem(
	items: ArgValNavigationItem[],
	scroller: HTMLElement
): ArgValNavigationItem | undefined {
	const scrollerRect = scroller.getBoundingClientRect();
	const scrollTop = scroller.scrollTop;

	let currentItem: ArgValNavigationItem | undefined;
	let currentTop = Number.NEGATIVE_INFINITY;

	for (const item of items) {
		const element = document.getElementById(encodeURIComponent(item.id));

		if (!element) {
			continue;
		}

		const offset = Number(element.dataset.offset || 0);
		const elementRect = element.getBoundingClientRect();
		const elementTop = scrollTop + elementRect.top - scrollerRect.top - offset;

		if (elementTop <= scrollTop + 1 && elementTop >= currentTop) {
			currentItem = item;
			currentTop = elementTop;
		}
	}

	return currentItem;
}

export {
	RUN_REPORT_TABLE_OF_CONTENTS_ID,
	getArgsValNavigationTarget,
	getCurrentArgsValNavigationItem,
	getVisibleArgsValNavigationItems
};
export type { ArgValNavigationDirection, ArgValNavigationItem };
