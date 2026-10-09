/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import { cn } from '../utils';

export interface FormSectionSubheaderProps {
	name: string;
	className?: string;
}

export const FormSectionSubheader: FC<FormSectionSubheaderProps> = ({
	name,
	className
}) => {
	return (
		<div className={cn('mb-3', className)}>
			<span className="inline-flex pl-2 text-[0.75rem] font-semibold uppercase leading-[0.875rem] tracking-[0.1em] text-text-menu">
				{name}
			</span>
		</div>
	);
};
