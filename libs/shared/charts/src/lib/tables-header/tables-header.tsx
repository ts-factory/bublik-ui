/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, ReactNode } from 'react';

import { CardHeader } from '@/shared/tailwind-ui';

export interface TableHeaderProps {
	children: ReactNode;
}

export const TableHeader: FC<TableHeaderProps> = ({ children }) => {
	return (
		<CardHeader label="Tables">
			<div className="flex items-center gap-4">{children}</div>
		</CardHeader>
	);
};
