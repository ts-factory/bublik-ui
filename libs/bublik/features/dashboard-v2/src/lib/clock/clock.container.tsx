/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';
import { format } from 'date-fns';

import { Clock, cn, Icon, Tooltip } from '@/shared/tailwind-ui';

import { useDashboardClock } from '../hooks';

export const ClockContainer = () => {
	const { latestTimestamp, refetch } = useDashboardClock();

	const formattedTime = useMemo(
		() => format(latestTimestamp, 'kk:mm:ss'),
		[latestTimestamp]
	);

	return (
		<div className="flex">
			<Tooltip content={`Current dashboard is fetched at: ${formattedTime}`}>
				<Clock time={latestTimestamp} disabled className="rounded-r-none" />
			</Tooltip>
			<Tooltip content="Click to refresh dashboard">
				<button
					className={cn(
						'flex items-center justify-center border border-border-primary border-l rounded-r-md px-3 transition-colors',
						'hover:bg-primary-wash hover:border-primary'
					)}
					onClick={refetch}
				>
					<Icon name="Refresh" className="text-primary" />
				</button>
			</Tooltip>
		</div>
	);
};
