/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, ReactNode } from 'react';

export interface FormHeaderProps {
	name: string;
	description?: string;
	children?: ReactNode;
}

export const FormHeader: FC<FormHeaderProps> = ({
	name,
	description,
	children
}) => {
	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-col gap-1 pl-2.5">
				<span className="text-[1.125rem] font-semibold leading-6 text-text-primary">
					{name}
				</span>
				{description ? (
					<span className="text-[0.8125rem] leading-[1.125rem] text-text-secondary">
						{description}
					</span>
				) : null}
			</div>
			{children}
		</div>
	);
};
