/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	ComponentPropsWithRef,
	ComponentPropsWithoutRef,
	forwardRef
} from 'react';

import { usePagination } from '@/shared/hooks';

import { cn, cva, VariantProps } from '../utils';
import { RadixSelect } from '../select';

const DEFAULT_PAGE_SIZES = ['10', '25', '50', '75', '100'];

const buttonStyles = cva({
	variants: {
		variant: {
			primary: [
				'flex items-center py-2 px-4 rounded-md text-[1rem]',
				'hover:bg-primary hover:text-white',
				'disabled:text-text-menu disabled:cursor-not-allowed disabled:bg-white disabled:hover:text-text-menu'
			],
			bordered: [
				'flex items-center py-2 px-4 rounded-md border text-[1rem]',
				'hover:border-primary hover:bg-primary-wash hover:text-primary',
				'disabled:text-text-menu disabled:cursor-not-allowed disabled:bg-white disabled:hover:text-text-menu disabled:hover:border-border-primary'
			],
			log: [
				'relative inline-flex items-center px-4 py-2 border text-sm font-medium first:rounded-l-lg last:rounded-r-lg'
			],
			// `bordered`, shrunk to table-footer scale. The data tables put this bar
			// beside `xss` toolbar controls, where the shared `py-2 px-4 text-[1rem]`
			// buttons read as a second, heavier toolbar.
			compact: [
				'flex items-center h-7 px-2 rounded border text-xs',
				'hover:border-primary hover:bg-primary-wash hover:text-primary',
				'disabled:text-text-menu disabled:cursor-not-allowed disabled:bg-white disabled:hover:text-text-menu disabled:hover:border-border-primary'
			]
		},
		isActive: { true: '', false: '' }
	},
	compoundVariants: [
		{
			variant: 'primary',
			isActive: true,
			className: 'bg-primary text-white'
		},
		{
			variant: 'primary',
			isActive: false,
			className: 'text-text-primary bg-white'
		},
		{
			variant: 'bordered',
			isActive: false,
			className: 'bg-white border-border-primary text-text-primary'
		},
		{
			variant: 'bordered',
			isActive: true,
			className: 'bg-primary-wash border-primary text-primary'
		},
		{
			variant: 'log',
			isActive: false,
			className:
				'bg-white border-border-primary text-text-primary hover:bg-primary-wash hover:text-primary'
		},
		{
			variant: 'log',
			isActive: true,
			className: 'bg-primary-wash border-primary text-primary z-10'
		},
		{
			variant: 'compact',
			isActive: false,
			className: 'bg-white border-border-primary text-text-primary'
		},
		{
			variant: 'compact',
			isActive: true,
			className: 'bg-primary-wash border-primary text-primary'
		}
	]
});

const wrapperStyles = cva({
	base: 'flex',
	variants: {
		variant: {
			primary: 'gap-1',
			bordered: 'gap-1',
			log: 'relative rounded-md -space-x-px',
			compact: 'items-center gap-1'
		}
	}
});

export interface PaginationRangeProps {
	variant?: VariantProps<typeof buttonStyles>['variant'];
	range: (string | number)[];
	currentPage: number;
	siblingCount: number;
	handlePageIndexClick: (page: number) => void;
	handleDotsClick: (page: number) => void;
}

const PaginationRange = ({
	variant,
	range,
	currentPage,
	siblingCount,
	handleDotsClick,
	handlePageIndexClick
}: PaginationRangeProps) => {
	return (
		<>
			{range.map((pageNumber, index, arr) => {
				if (typeof pageNumber !== 'number') {
					let whereToJump: 'prev' | 'next';

					if (
						Number(arr[index - 1]) < currentPage &&
						Number(arr[index + 1]) < currentPage
					) {
						whereToJump = 'prev';
					} else {
						whereToJump = 'next';
					}

					const offset = siblingCount * 2 + 1; // siblings from 2 sides + current element

					const pageToJumpTo =
						whereToJump === 'prev'
							? currentPage - offset
							: currentPage + offset;

					return (
						<PageButton
							key={`${whereToJump}-${pageToJumpTo}`}
							variant={variant}
							onClick={() => handleDotsClick(pageToJumpTo)}
						>
							&#8230;
						</PageButton>
					);
				}

				return (
					<PageButton
						key={pageNumber}
						variant={variant}
						onClick={() => handlePageIndexClick(pageNumber as number)}
						isActive={currentPage === pageNumber}
					>
						{pageNumber}
					</PageButton>
				);
			})}
		</>
	);
};

export interface PageButtonProps extends ComponentPropsWithRef<'button'> {
	variant?: VariantProps<typeof buttonStyles>['variant'];
	isActive?: boolean;
}

const PageButton = forwardRef<HTMLButtonElement, PageButtonProps>(
	({ isActive = false, children, variant, ...props }, ref) => {
		return (
			<button
				className={buttonStyles({ variant, isActive })}
				ref={ref}
				{...props}
			>
				{children}
			</button>
		);
	}
);

export interface PaginationProps extends ComponentPropsWithoutRef<'div'> {
	variant?: VariantProps<typeof buttonStyles>['variant'];
	totalCount: number;
	pageSize?: number;
	currentPage?: number;
	siblingCount?: number;
	onPageChange?: (newPageIndex: number) => void;
	onPageSizeChange?: (newPageSize: number) => void;
	disablePageSizeSelect?: boolean;
}

export const Pagination = (props: PaginationProps) => {
	const {
		variant = 'primary',
		totalCount,
		pageSize = 25,
		currentPage = 1,
		siblingCount = 1,
		onPageChange,
		onPageSizeChange,
		disablePageSizeSelect,
		className,
		...restProps
	} = props;
	const paginationRange = usePagination({
		currentPage,
		totalCount,
		siblingCount,
		pageSize
	});

	// `compact` lives in a table footer that already shows a row count beside it,
	// so hiding the controls at one page leaves a half-empty bar that reads as
	// broken rather than as "there is only one page". Every other variant keeps
	// the original bail — the runs, history and log pages rely on it.
	const isCompact = variant === 'compact';

	if (currentPage === 0 || (!isCompact && paginationRange.length < 2)) {
		return null;
	}

	// At one page the range is `[1]`, at zero rows it is empty, so read the last
	// page defensively instead of off the end of the array.
	const lastPage = paginationRange[paginationRange.length - 1] ?? 1;
	const isLastPage = currentPage >= Number(lastPage);
	const isFirstPage = currentPage === 1;

	const handleNextClick = () => onPageChange?.(currentPage + 1);

	const handlePreviousClick = () => onPageChange?.(currentPage - 1);

	const handlePageIndexClick = (pageNumber: number) => {
		onPageChange?.(pageNumber);
	};

	const handlePageSizeChange = (newPageSize: string) => {
		onPageSizeChange?.(Number(newPageSize));
	};

	const handleDotsClick = (pageNumber: number) => {
		if (pageNumber <= Number(lastPage) && pageNumber >= 1) {
			onPageChange?.(pageNumber);
		}
	};

	return (
		// `className` is merged rather than spread through `restProps`, which would
		// let a caller's `ml-auto` replace the wrapper's own `flex` outright — the
		// buttons are `display: flex`, so without a flex parent they turn
		// block-level and stack into a column.
		<div
			className={cn(wrapperStyles({ variant }), className)}
			data-testid="tw-pagination"
			{...restProps}
		>
			<PageButton
				variant={variant}
				onClick={handlePreviousClick}
				disabled={isFirstPage}
			>
				Previous
			</PageButton>
			{/* `compact` shows position instead of a numbered range. It sits in a
			    table footer beside a row count, where a strip of page numbers is
			    more chrome than the footer can carry — and with 100 rows a page,
			    jumping to page 7 is rarely the thing you want. */}
			{isCompact ? (
				<span className="px-1 text-xs text-text-menu tabular-nums">
					{currentPage} / {lastPage}
				</span>
			) : (
				<PaginationRange
					variant={variant}
					range={paginationRange}
					currentPage={currentPage}
					siblingCount={siblingCount}
					handleDotsClick={handleDotsClick}
					handlePageIndexClick={handlePageIndexClick}
				/>
			)}
			<PageButton
				variant={variant}
				onClick={handleNextClick}
				disabled={isLastPage}
			>
				Next
			</PageButton>
			{disablePageSizeSelect ? null : (
				<RadixSelect
					label="Page sizes"
					options={DEFAULT_PAGE_SIZES}
					defaultValue={pageSize.toString() || DEFAULT_PAGE_SIZES[1]}
					onValueChange={handlePageSizeChange}
					triggerVariant={
						isCompact
							? 'compact'
							: variant === 'bordered'
							? 'bordered'
							: 'primary'
					}
				/>
			)}
		</div>
	);
};
