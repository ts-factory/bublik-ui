/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Clock, Tooltip } from '@/shared/tailwind-ui';

import { useDashboardClock } from '../hooks';

export const ClockContainer = () => {
	const { latestTimestamp, refetch } = useDashboardClock();

	return (
		<Tooltip content="Click to refetch">
			<Clock time={latestTimestamp} onClick={refetch} />
		</Tooltip>
	);
};
