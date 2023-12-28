/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';
import { getTotalPageCount } from '@/shared/utils';

export interface PaginationConfig {
	totalCount: number;
	pageSize: number;
	currentPage: number;
	siblingCount?: number;
}

const range = (start: number, end: number) => {
	const length = end - start + 1;

	return Array.from({ length }, (_, idx) => idx + start);
};

export const DOTS = '...';

export const usePagination = ({
	totalCount,
	pageSize,
	currentPage,
	siblingCount = 1
}: PaginationConfig) => {
	const paginationRange = useMemo(() => {
		const totalPageCount = getTotalPageCount(totalCount, pageSize);
		const totalPageNumbers = siblingCount + 5;

		if (totalPageNumbers >= totalPageCount) {
			return range(1, totalPageCount);
		}

		const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
		const rightSiblingIndex = Math.min(
			currentPage + siblingCount,
			totalPageCount
		);

		const shouldShowLeftDots = leftSiblingIndex > 2;
		const shouldShowRightDots = rightSiblingIndex < totalPageCount - 2;

		const firstPageIndex = 1;
		const lastPageIndex = totalPageCount;

		if (!shouldShowLeftDots && shouldShowRightDots) {
			const leftItemCount = 3 + 2 * siblingCount;
			const leftRange = range(1, leftItemCount);

			return [...leftRange, DOTS, totalPageCount];
		}

		if (shouldShowLeftDots && !shouldShowRightDots) {
			const rightItemCount = 3 + 2 * siblingCount;
			const rightRange = range(
				totalPageCount - rightItemCount + 1,
				totalPageCount
			);
			return [firstPageIndex, DOTS, ...rightRange];
		}

		const middleRange = range(leftSiblingIndex, rightSiblingIndex);
		return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
	}, [totalCount, pageSize, siblingCount, currentPage]);

	return paginationRange;
};
