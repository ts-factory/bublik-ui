/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import { DiffType } from '../run-diff/run-diff.types';

export interface GutterProps {
	diffType: DiffType;
}

export const Gutter: FC<GutterProps> = ({ diffType }) => {
	const isAdded = diffType === DiffType.ADDED;
	const isRemoved = diffType === DiffType.REMOVED;
	const isChanged = diffType === DiffType.CHANGED;

	return (
		<span className="flex items-center justify-center px-2 font-medium text-[0.75rem] leading-[1.125rem] w-full h-full">
			{isAdded && '+'}
			{isRemoved && '-'}
			{isChanged && '+/-'}
		</span>
	);
};
