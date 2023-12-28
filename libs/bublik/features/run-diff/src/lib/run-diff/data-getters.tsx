/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { MergedRunDataWithDiff, RunDataWithDiff } from './run-diff.types';

export const createDataGetter =
	(
		leftOrRight: 'left' | 'right',
		getter: (data: RunDataWithDiff | null) => unknown
	) =>
	(data: MergedRunDataWithDiff) => {
		if (leftOrRight === 'left') return getter(data.left);
		if (leftOrRight === 'right') return getter(data.right);

		return null;
	};
