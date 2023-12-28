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
		<div className="mb-2">
			<span className="text-[0.6875rem] leading-[0.875rem]">{name}</span>
		</div>
	);
};
