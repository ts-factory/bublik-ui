/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

export interface FormSectionSubheaderProps {
	name: string;
}

export const FormSectionSubheader: FC<FormSectionSubheaderProps> = ({
	name
}) => {
	return (
		<div className="mb-3">
			<span className="inline-flex pl-2 text-[0.75rem] font-semibold uppercase leading-[0.875rem] tracking-[0.1em] text-text-menu">
				{name}
			</span>
		</div>
	);
};
