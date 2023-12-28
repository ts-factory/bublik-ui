/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentPropsWithRef, forwardRef } from 'react';

import { cn } from '../utils';

import styles from './spinner.module.scss';

export type SpinnerProps = ComponentPropsWithRef<'div'>;

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
	({ className, ...props }, ref) => {
		return (
			<div
				className={cn('grid place-items-center w-full text-primary', className)}
				{...props}
				ref={ref}
				data-testid="tw-spinner"
			>
				<div className={styles['spinner-wrapper']}>
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<circle cx="8" cy="8" r="7" strokeWidth="2" />
					</svg>
				</div>
			</div>
		);
	}
);
