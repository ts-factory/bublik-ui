/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import React, { FC } from 'react';

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
		isNotExpected
	} = props;

	return (
		<div className="flex flex-col gap-1" data-testid="tw-verdict-list">
			<VerdictResult
				variant={variant}
				resultType={result}
				isNotExpected={isNotExpected}
				isSelected={isResultSelected}
				onResultClick={onResultClick}
			/>
			<ListOfVerdicts
				verdicts={verdicts}
				selectedVerdicts={selectedVerdicts}
				onVerdictClick={onVerdictClick}
			/>
		</div>
	);
};
