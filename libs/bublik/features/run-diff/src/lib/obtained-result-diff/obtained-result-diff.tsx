/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, useMemo } from 'react';
import { diffArrays } from 'diff';

import { Badge, BadgeVariants, cn } from '@/shared/tailwind-ui';

export interface ObtainedResultDiffProps {
	side: 'left' | 'right';
	leftResultType?: string;
	leftIsNotExpected?: boolean;
	leftVerdicts?: string[];
	rightResultType?: string;
	rightIsNotExpected?: boolean;
	rightVerdicts?: string[];
}

export const ObtainedResultDiff: FC<ObtainedResultDiffProps> = (props) => {
	const {
		side,
		leftResultType,
		leftIsNotExpected,
		leftVerdicts = [],
		rightResultType,
		rightIsNotExpected,
		rightVerdicts = []
	} = props;

	const resultType = side === 'left' ? leftResultType : rightResultType;
	const isNotExpected =
		side === 'left' ? leftIsNotExpected : rightIsNotExpected;
	const isResultTypeChanged =
		leftIsNotExpected !== rightIsNotExpected ||
		leftResultType !== rightResultType;
	const badgeVariant = isNotExpected
		? BadgeVariants.Unexpected
		: BadgeVariants.Expected;

	const diff = useMemo(() => {
		const diff = diffArrays(leftVerdicts, rightVerdicts);
		const removed = diff.filter((change) => change.removed);
		const added = diff.filter((change) => change.added);
		const notChanged = diff.filter(
			(change) =>
				typeof change['added'] === 'undefined' &&
				typeof change['removed'] === 'undefined'
		);

		return side === 'left'
			? [...notChanged, ...removed]
			: [...notChanged, ...added];
	}, [leftVerdicts, rightVerdicts, side]);

	if (side === 'left' && !leftResultType) return null;
	if (side === 'right' && !rightResultType) return null;

	return (
		<div className="flex flex-col gap-1">
			<div className="flex gap-1">
				<Badge variant={badgeVariant}>{resultType}</Badge>
			</div>
			<div className="flex flex-col flex-wrap gap-1">
				{diff.map((change, idx) => (
					<div key={idx} className="flex flex-col flex-wrap gap-1">
						{change.value.map((value) => (
							<Badge
								key={value}
								variant={BadgeVariants.Transparent}
								className={cn(
									change.added && 'bg-green-300 text-black border-transparent',
									change.removed && 'bg-red-300 text-black border-transparent'
								)}
							>
								{value}
							</Badge>
						))}
					</div>
				))}
			</div>
		</div>
	);
};
