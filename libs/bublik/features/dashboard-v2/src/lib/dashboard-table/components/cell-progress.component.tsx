/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef, SVGProps } from 'react';

import { cn, Tooltip } from '@/shared/tailwind-ui';

const Arrow = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
	(props, ref) => {
		return (
			<svg
				width="8"
				height="6"
				viewBox="0 0 8 6"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				{...props}
				ref={ref}
			>
				<path
					d="M4 0.310547L7.19515 5.84472H0.804839L4 0.310547Z"
					fill="currentColor"
				/>
			</svg>
		);
	}
);

export interface CellProgressProps {
	progress: number;
	/**
	 * The column's alignment. In a left-aligned column a finished run keeps an
	 * empty slot where the icon goes, so every row's percentage starts at the
	 * same point; a right-aligned one lines them up on its edge already.
	 */
	align?: 'left' | 'right';
}

const iconStyles = 'p-1 rounded-full shrink-0';

export const CellProgress = (props: CellProgressProps) => {
	const { progress, align = 'left' } = props;
	const formatted = `${progress}%`;
	const isFinished = progress === 100;

	return (
		<Tooltip content={formatted}>
			<div className="flex min-w-0 items-center gap-1.5">
				{!isFinished ? (
					<div className={cn(iconStyles, 'text-primary bg-bg-running/20')}>
						<Arrow width={8} height={8} />
					</div>
				) : align === 'left' ? (
					<div aria-hidden className={cn(iconStyles, 'invisible')}>
						<Arrow width={8} height={8} />
					</div>
				) : null}
				{/* Wide enough for "100%" and right-aligned, so the digits line up
				    in every row. */}
				<span className="min-w-[4.5ch] text-right tabular-nums">
					{formatted}
				</span>
			</div>
		</Tooltip>
	);
};
