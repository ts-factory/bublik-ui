/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { RunData } from '@/shared/types';

export const enum DiffType {
	/** Value hasn't changed from old to new */
	DEFAULT = 'default',
	/** Value was inserted into new data */
	ADDED = 'added',
	/** Value was removed from new data */
	REMOVED = 'removed',
	/** Value was changed between left/right */
	CHANGED = 'changed'
}

export interface RunDataWithDiff extends RunData {
	diff: { type: DiffType };
	children: RunDataWithDiff[];
}

export interface MergedRunDataWithDiff {
	left: RunDataWithDiff | null;
	right: RunDataWithDiff | null;
	children: MergedRunDataWithDiff[];
	diffType: DiffType;
}
