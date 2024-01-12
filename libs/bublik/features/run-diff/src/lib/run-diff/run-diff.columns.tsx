/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode, SVGProps } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ColumnDef, RowData } from '@tanstack/react-table';

import { RunData } from '@/shared/types';
import { isDefined } from '@/shared/utils';
import {
	badgeBaseStyles,
	badgeSelectedStyles,
	BadgeVariants,
	badgeVariantStyles,
	TableNode,
	cn,
	Icon
} from '@/shared/tailwind-ui';
import {
	getTreeNode,
	getFailedExpected,
	getFailedUnexpected,
	getPassedExpected,
	getPassedUnexpected,
	getSkippedExpected,
	getSkippedUnexpected,
	getRunRunStats,
	getTotalRunStats,
	getAbnormal
} from '@/bublik/run-utils';

import { MergedRunDataWithDiff } from './run-diff.types';
import {
	hoverCellLeave,
	hoverCellStart,
	selectIsHoveredCell
} from '../run-diff.slice';
import { createDataGetter } from './data-getters';
import { Gutter } from '../gutter';

const ArrowIcon = (props: SVGProps<SVGSVGElement>) => {
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M11.176 20.2844C11.2272 20.6877 11.5767 21 11.9998 21C12.4582 21 12.8302 20.6335 12.8302 20.1818V5.79927L18.0813 10.9953L18.1661 11.0688C18.4909 11.3138 18.9576 11.2895 19.256 10.9975C19.5804 10.6789 19.5815 10.1607 19.2582 9.84109L12.5877 3.24109L12.5042 3.16831C12.3581 3.05758 12.1797 3 11.9998 3C11.8924 3 11.785 3.02073 11.6832 3.06218C11.3721 3.18873 11.1695 3.48655 11.1695 3.81818V20.1818L11.176 20.2844ZM4.74399 10.9976C5.06949 11.3161 5.59538 11.3161 5.91866 10.9954L9.59768 7.35502L9.672 7.27097C9.91963 6.94949 9.89384 6.49065 9.59546 6.19865C9.43271 6.03938 9.22125 5.95975 9.00979 5.95975C8.79611 5.95975 8.58354 6.03938 8.42079 6.20084L4.74177 9.84011L4.66771 9.92417C4.42092 10.2458 4.44663 10.7056 4.74399 10.9976Z"
				fill="currentColor"
			/>
		</svg>
	);
};

declare module '@tanstack/react-table' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData extends RowData, TValue> {
		className?: string;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface TableMeta<TData extends RowData> {
		id?: string;
	}
}

export interface RunDiffBadgeProps {
	isChanged?: boolean;
	value?: string | number;
	variant?: BadgeVariants;
	rowId: string;
	columnId: string;
	arrowDirection?: 'up' | 'down';
}

const RunDiffBadge = (props: RunDiffBadgeProps) => {
	const dispatch = useDispatch();
	const { arrowDirection, isChanged, value, variant, rowId, columnId } = props;
	const isHoveredCell = useSelector(selectIsHoveredCell(columnId, rowId));

	const handleMouseEnter = () => dispatch(hoverCellStart({ rowId, columnId }));
	const handleMouseLeave = () => dispatch(hoverCellLeave());

	const badgeStyles = cn(
		badgeBaseStyles(),
		badgeVariantStyles({ variant }),
		isChanged && badgeSelectedStyles({ variant }),
		isHoveredCell && 'bg-fuchsia-500 text-white'
	);

	return (
		<div
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			className={badgeStyles}
		>
			<div className="flex items-center gap-1">
				<span>{value}</span>
				{isChanged && (
					<ArrowIcon
						width={14}
						height={14}
						className={
							arrowDirection === 'down' ? 'rotate-180 text-white' : 'text-white'
						}
					/>
				)}
			</div>
		</div>
	);
};

export interface CreateColumnConfig {
	getter: (data?: RunData | null) => number | null;
	id: string;
	header: string;
	leftOrRight: 'left' | 'right';
	badgeVariant: BadgeVariants;
	headerIcon?: ReactNode;
}

const createRunDiffColumn: (
	config: CreateColumnConfig
) => ColumnDef<MergedRunDataWithDiff> = (config) => {
	const { id, header, leftOrRight, getter, badgeVariant, headerIcon } = config;

	return {
		id,
		header: () => (
			<div className="flex items-center gap-2">
				<span className="text-[0.6875rem] font-semibold leading-[0.875rem]">
					{header}
				</span>
				{headerIcon}
			</div>
		),
		accessorFn: (data) => data,
		cell: (cell) => {
			const { left, right } = cell.getValue<MergedRunDataWithDiff>();
			const variant: BadgeVariants = badgeVariant;

			const leftValue = getter(left);
			const rightValue = getter(right);
			const value = leftOrRight === 'left' ? leftValue : rightValue;

			let isChanged = false;
			if (isDefined(leftValue) && isDefined(rightValue)) {
				isChanged = leftValue !== rightValue;
			}

			let arrowDirection: 'up' | 'down' | undefined;
			if (isChanged && isDefined(leftValue) && isDefined(rightValue)) {
				if (leftOrRight === 'left') {
					arrowDirection = leftValue > rightValue ? 'up' : 'down';
				} else {
					arrowDirection = rightValue > leftValue ? 'up' : 'down';
				}
			}

			if (!isDefined(value)) return null;

			return (
				<RunDiffBadge
					arrowDirection={arrowDirection}
					value={value}
					isChanged={isChanged}
					variant={variant}
					rowId={cell.row.id}
					columnId={cell.column.id}
				/>
			);
		}
	};
};

const createColumns = (
	leftOrRight: 'left' | 'right'
): ColumnDef<MergedRunDataWithDiff>[] => {
	const ID_POSTFIX = leftOrRight === 'left' ? 'LEFT' : 'RIGHT';

	return [
		{
			id: `NAME_${ID_POSTFIX}`,
			header: () => (
				<div className="flex justify-between">
					<span className="text-[0.6875rem] font-semibold leading-[0.875rem]">
						Tree
					</span>
				</div>
			),
			accessorFn: createDataGetter(leftOrRight, getTreeNode),
			cell: (cell) => {
				const row = cell.row;
				const value = cell.getValue<ReturnType<typeof getTreeNode>>();

				if (!value) return null;

				return (
					<TableNode
						nodeName={value.name}
						nodeType={value.type}
						depth={row.depth}
						onClick={row.getToggleExpandedHandler()}
						isExpanded={row.getIsExpanded()}
					/>
				);
			},
			meta: { className: 'pl-2.5' }
		},
		createRunDiffColumn({
			id: `TOTAL_${ID_POSTFIX}`,
			header: 'Total',
			leftOrRight,
			getter: getTotalRunStats,
			badgeVariant: BadgeVariants.PrimaryActive
		}),
		createRunDiffColumn({
			id: `RUN_${ID_POSTFIX}`,
			header: 'Run',
			leftOrRight,
			getter: getRunRunStats,
			badgeVariant: BadgeVariants.PrimaryActive
		}),
		createRunDiffColumn({
			id: `PASSED_EXPECTED_${ID_POSTFIX}`,
			header: 'Passed',
			headerIcon: (
				<Icon
					name="InformationCircleCheckmark"
					size={16}
					className="text-text-expected"
				/>
			),
			leftOrRight,
			getter: getPassedExpected,
			badgeVariant: BadgeVariants.ExpectedActive
		}),
		createRunDiffColumn({
			id: `FAILED_EXPECTED_${ID_POSTFIX}`,
			header: 'Failed',
			headerIcon: (
				<Icon
					name="InformationCircleCheckmark"
					size={16}
					className="text-text-expected"
				/>
			),
			leftOrRight,
			getter: getFailedExpected,
			badgeVariant: BadgeVariants.ExpectedActive
		}),
		createRunDiffColumn({
			id: `SKIPPED_EXPECTED_${ID_POSTFIX}`,
			header: 'Skipped',
			headerIcon: (
				<Icon
					name="InformationCircleExclamationMark"
					size={16}
					className="text-text-expected"
				/>
			),
			leftOrRight,
			getter: getSkippedExpected,
			badgeVariant: BadgeVariants.ExpectedActive
		}),
		createRunDiffColumn({
			id: `PASSED_UNEXPECTED_${ID_POSTFIX}`,
			header: 'Passed',
			headerIcon: (
				<Icon
					name="InformationCircleExclamationMark"
					size={16}
					className="text-text-unexpected"
				/>
			),
			leftOrRight,
			getter: getPassedUnexpected,
			badgeVariant: BadgeVariants.UnexpectedActive
		}),
		createRunDiffColumn({
			id: `FAILED_UNEXPECTED_${ID_POSTFIX}`,
			header: 'Failed',
			headerIcon: (
				<Icon
					name="InformationCircleExclamationMark"
					size={16}
					className="text-text-unexpected"
				/>
			),
			leftOrRight,
			getter: getFailedUnexpected,
			badgeVariant: BadgeVariants.UnexpectedActive
		}),
		createRunDiffColumn({
			id: `SKIPPED_UNEXPECTED_${ID_POSTFIX}`,
			header: 'Skipped',
			headerIcon: (
				<Icon
					name="InformationCircleExclamationMark"
					size={16}
					className="text-text-unexpected"
				/>
			),
			leftOrRight,
			getter: getSkippedUnexpected,
			badgeVariant: BadgeVariants.UnexpectedActive
		}),
		createRunDiffColumn({
			id: `ABNORMAL_${ID_POSTFIX}`,
			header: 'Abnormal',
			headerIcon: (
				<Icon
					name="InformationCircleExclamationMark"
					size={16}
					className="text-text-unexpected"
				/>
			),
			leftOrRight,
			getter: getAbnormal,
			badgeVariant: BadgeVariants.UnexpectedActive
		})
	];
};

const createRunDiffColumns = () => {
	const mergedColumns: ColumnDef<MergedRunDataWithDiff>[] = [
		{
			id: 'GUTTER_LEFT',
			cell: (cell) => <Gutter diffType={cell.row.original.diffType} />,
			meta: { className: 'border-r border-border-primary w-[34px]' }
		},
		...createColumns('left'),
		{
			id: 'GUTTER_RIGHT',
			cell: (cell) => <Gutter diffType={cell.row.original.diffType} />,
			meta: { className: 'border-r border-l border-border-primary w-[34px]' }
		},
		...createColumns('right')
	];

	return { mergedColumns };
};

export const { mergedColumns } = createRunDiffColumns();
