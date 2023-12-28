/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, ReactNode } from 'react';

export interface HeaderWithIconProps {
	header: string;
	icon?: ReactNode;
}

export const TableHeader: FC<HeaderWithIconProps> = ({ header, icon }) => {
	if (icon) {
		return (
			<div className="flex items-center gap-2">
				{header}
				{icon}
			</div>
		);
	}

	// eslint-disable-next-line react/jsx-no-useless-fragment
	return <>{header}</>;
};
