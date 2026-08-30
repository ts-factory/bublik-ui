/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import React, { FC, ReactNode } from 'react';

import { RESULT_TYPE } from '@/shared/types';

import { Badge, BadgeVariants } from '../badge';

export const enum VerdictVariant {
	Expected = 'expected',
	Obtained = 'obtained'
}

export type VerdictVariantValue = 'expected' | 'obtained';

export interface VerdictResultProps {
	variant: VerdictVariant | VerdictVariantValue;
	resultType: RESULT_TYPE;
	isNotExpected?: boolean;
	isSelected?: boolean;
	onResultClick?: (resultType: RESULT_TYPE) => void;
}

export const VerdictResult = (props: VerdictResultProps) => {
	const { variant, resultType, onResultClick, isNotExpected, isSelected } =
		props;

	const resultVariant =
		variant === 'obtained'
			? isNotExpected
				? BadgeVariants.Unexpected
				: BadgeVariants.Expected
			: BadgeVariants.Transparent;

	return (
		<Badge
			variant={resultVariant}
			isSelected={isSelected}
			onClick={onResultClick ? () => onResultClick?.(resultType) : undefined}
		>
			{resultType}
		</Badge>
	);
};

export interface ListOfVerdictProps {
	verdicts: VerdictListProps['verdicts'];
	selectedVerdicts: VerdictListProps['selectedVerdicts'];
	onVerdictClick: VerdictListProps['onVerdictClick'];
}

export const ListOfVerdicts: FC<ListOfVerdictProps> = ({
	verdicts,
	selectedVerdicts,
	onVerdictClick
}) => {
	return (
		<div className="flex flex-col flex-wrap gap-1">
			{verdicts.map((verdict) => {
				const isSelected = selectedVerdicts?.includes(verdict);

				return (
					<Badge
						key={verdict}
						variant={BadgeVariants.Transparent}
						isSelected={isSelected}
						onClick={onVerdictClick ? () => onVerdictClick(verdict) : undefined}
						className="text-start"
						overflowWrap
					>
						{verdict}
					</Badge>
				);
			})}
		</div>
	);
};

export interface VerdictListProps {
	variant: VerdictVariant | VerdictVariantValue;
	result: RESULT_TYPE;
	verdicts: string[];
	isResultSelected?: boolean;
	isNotExpected?: boolean;
	selectedVerdicts?: string[];
	onResultClick?: (resultValue: RESULT_TYPE) => void;
	onVerdictClick?: (verdict: string) => void;
	/**
	 * Rendered inline after the result badge, e.g. the classification verdict and
	 * its Classify trigger -- `PASSED | NO EFFECT | Classify`. It qualifies the
	 * result, so it belongs on the result's own line rather than under the
	 * verdicts, where it would sit three lines from what it is talking about.
	 */
	resultSlot?: ReactNode;
}

export const VerdictList: FC<VerdictListProps> = (props) => {
	const {
		variant,
		result,
		verdicts,
		isResultSelected,
		selectedVerdicts,
		onResultClick,
		onVerdictClick,
		isNotExpected,
		resultSlot
	} = props;

	const resultBadge = (
		<VerdictResult
			variant={variant}
			resultType={result}
			isNotExpected={isNotExpected}
			isSelected={isResultSelected}
			onResultClick={onResultClick}
		/>
	);

	return (
		<div className="flex flex-col gap-1" data-testid="tw-verdict-list">
			{/* The row exists only when there is something to put in it: every
			    Expected Results call site passes no slot, and wrapping the badge
			    there would change their markup for nothing. */}
			{resultSlot ? (
				<div className="flex items-center gap-1.5">
					{resultBadge}
					{resultSlot}
				</div>
			) : (
				resultBadge
			)}
			<ListOfVerdicts
				verdicts={verdicts}
				selectedVerdicts={selectedVerdicts}
				onVerdictClick={onVerdictClick}
			/>
		</div>
	);
};
