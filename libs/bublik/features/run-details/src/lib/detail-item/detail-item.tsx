/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode } from 'react';

export interface RunDetailsLabelProps {
	label: string;
	value?: string | number | ReactNode | null;
}

export const DetailItem = ({ label, value }: RunDetailsLabelProps) => {
	return (
		<>
			<dt className="text-[0.6875rem] font-medium leading-[0.875rem] text-text-menu">
				{label}
			</dt>
			<dd className="text-[0.6875rem] font-medium leading-[0.875rem]">
				{value === null ? '-' : value}
			</dd>
		</>
	);
};
