/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { LinkProps } from 'react-router-dom';

import { cva } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';

const linkStyles = cva({
	base: [
		'grid grid-cols-3 gap-x-1',
		'py-0.5 px-1 border border-transparent w-[132px] rounded ',
		'text-[0.75rem] font-medium leading-[1.125rem] hover:underline whitespace-nowrap'
	]
});

export interface SummaryBadgeProps extends LinkProps {
	label: string;
	count: number;
	percentage?: number;
}

export const SummaryBadge = (props: SummaryBadgeProps) => {
	const { label, count, percentage, className, ...rest } = props;
	const percentageStr = percentage ? `${percentage}%` : '0%';

	return (
		<LinkWithProject className={linkStyles({ className })} {...rest}>
			<span>{label}:</span>
			<span className="text-right border-l border-gray-500/30">{count}</span>
			<span className="text-right border-l border-gray-500/30">
				{percentageStr}
			</span>
		</LinkWithProject>
	);
};
