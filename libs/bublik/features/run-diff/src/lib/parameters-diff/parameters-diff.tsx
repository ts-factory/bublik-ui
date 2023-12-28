/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, useMemo } from 'react';
import { diffArrays } from 'diff';

import { Badge, cn } from '@/shared/tailwind-ui';

export interface ParameterDiffProps {
	side: 'left' | 'right';
	left?: string[];
	right?: string[];
}

export const ParametersDiff: FC<ParameterDiffProps> = (props) => {
	const { side, left = [], right = [] } = props;

	const diff = useMemo(() => {
		const diff = diffArrays(left, right);
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
	}, [left, right, side]);

	if (side === 'left' && !left.length) return null;
	if (side === 'right' && !right.length) return null;

	return (
		<div className="flex flex-col flex-wrap gap-1">
			{diff.map((change, idx) => (
				<div key={idx} className="flex flex-col flex-wrap gap-1">
					{change.value.map((value) => (
						<Badge
							key={value}
							className={cn(
								'bg-badge-1',
								change.added && 'bg-green-300 text-black',
								change.removed && 'bg-red-300 text-black'
							)}
						>
							{value}
						</Badge>
					))}
				</div>
			))}
		</div>
	);
};
