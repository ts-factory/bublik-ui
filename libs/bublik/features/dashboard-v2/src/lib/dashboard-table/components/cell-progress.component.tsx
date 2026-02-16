/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef, SVGProps } from 'react';

import { Tooltip } from '@/shared/tailwind-ui';

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
}

export const CellProgress = (props: CellProgressProps) => {
	const formatted = `${props.progress}%`;

	return (
		<Tooltip content={formatted}>
			<div className="flex min-w-0 items-center gap-1.5">
				{props.progress === 100 ? null : (
					<div className="text-primary bg-bg-running/20 p-1 rounded-full">
						<Arrow width={8} height={8} />
					</div>
				)}
				{formatted}
			</div>
		</Tooltip>
	);
};
