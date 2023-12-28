/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, ReactNode } from 'react';

export interface FormHeaderProps {
	name: string;
	children?: ReactNode;
}

export const FormHeader: FC<FormHeaderProps> = ({ name, children }) => {
	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-2">
				<span className="text-[0.875rem] font-semibold">{name}</span>
			</div>
			{children}
		</div>
	);
};
