/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { ComponentProps, PropsWithChildren } from 'react';

import { RUN_STATUS } from '@/shared/types';

import { HoverCard } from '../hover-card';
import { ConclusionBadge } from '../conclusion-badge';

interface ConclusionHoverCardProps extends ComponentProps<typeof HoverCard> {
	conclusion: RUN_STATUS;
	conclusionReason?: string | null;
}

function ConclusionHoverCard(
	props: PropsWithChildren<ConclusionHoverCardProps>
) {
	const { children, conclusion, conclusionReason, ...restProps } = props;

	return (
		<HoverCard
			content={
				<div className="bg-white p-4 shadow-lg rounded-lg border border-border-primary">
					<dl className="grid items-center grid-cols-[max-content,max-content] gap-x-6 gap-y-2">
						<dt className="text-[0.6875rem] font-medium leading-[0.875rem] text-text-menu">
							Conclusion:
						</dt>
						<dd>
							<ConclusionBadge status={conclusion} />
						</dd>
						{conclusionReason ? (
							<>
								<dt className="text-[0.6875rem] font-medium leading-[0.875rem] text-text-menu">
									Conclusion Reason:
								</dt>
								<dd className="text-[0.6875rem] font-medium leading-[0.875rem]">
									{conclusionReason}
								</dd>
							</>
						) : null}
					</dl>
				</div>
			}
			sideOffset={8}
			{...restProps}
		>
			{children}
		</HoverCard>
	);
}

export { ConclusionHoverCard };
