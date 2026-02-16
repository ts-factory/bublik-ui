/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Skeleton } from '@/shared/tailwind-ui';
import { BublikErrorState } from '@/bublik/features/ui-state';

import { getStatusAndBasis } from './run-progress.utils';

export interface RunProgressProps {
	data?: boolean[];
	isError: boolean;
	isLoading: boolean;
	error?: unknown;
}

export const RunProgress = (props: RunProgressProps) => {
	const { data, isLoading, isError, error } = props;

	if (isError) {
		return (
			<div className="overflow-hidden">
				<BublikErrorState error={error} className="h-auto" iconSize={16} />
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="relative flex items-center justify-center gap-1">
				<Skeleton className="basis-full relative rounded-[10px] opacity-70 h-2 overflow-hidden" />
			</div>
		);
	}

	if (data) {
		return (
			<ul className="relative flex w-full min-w-0 flex-nowrap items-center gap-1 overflow-hidden">
				{getStatusAndBasis(data).map(({ status, basis }, idx) => (
					<li
						key={idx}
						className={`relative rounded-[10px] h-2 overflow-hidden opacity-70 ${
							status === 'ok' ? 'bg-bg-ok' : 'bg-bg-error'
						}`}
						style={{ flexBasis: 0, flexGrow: basis }}
					/>
				))}
			</ul>
		);
	}

	return null;
};
