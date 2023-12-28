/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Skeleton } from '@/shared/tailwind-ui';

import { useDashboardModePicker } from '../hooks';

import { ModePicker } from './mode-picker.component';

export const ModePickerContainer = () => {
	const { handleModeChange, isModeLoading, mode } = useDashboardModePicker();

	if (isModeLoading) {
		return <Skeleton className="rounded-md h-10 w-[134px]" />;
	}

	return (
		<ModePicker type="single" onValueChange={handleModeChange} value={mode} />
	);
};
