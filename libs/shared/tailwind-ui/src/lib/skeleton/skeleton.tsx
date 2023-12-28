/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { HTMLAttributes } from 'react';
import { cn } from '../utils';

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export const Skeleton = (props: SkeletonProps) => {
	const { className, ...restProps } = props;

	return (
		<div
			className={cn('animate-pulse bg-gray-300', className)}
			{...restProps}
		/>
	);
};
