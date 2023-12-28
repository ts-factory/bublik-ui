/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Link, LinkProps } from 'react-router-dom';

import { cva } from '@/shared/tailwind-ui';

const linkStyles = cva({
	base: 'flex items-center justify-center py-0.5 px-2 border border-transparent min-w-[115px] rounded hover:underline'
});

export interface SummaryBadgeProps extends LinkProps {
	label: string;
	count: number;
	percentage?: number;
}

export const SummaryBadge = (props: SummaryBadgeProps) => {
	const { label, count, percentage, className, ...rest } = props;
	const percentageStr = percentage ? `(${percentage}%)` : '(0%)';

	return (
		<Link className={linkStyles({ className })} {...rest}>
			<span className="text-[0.75rem] font-medium leading-[1.125rem]">
				{label}: {count} {percentageStr}
			</span>
		</Link>
	);
};
