/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import { RUN_STATUS } from '@/shared/types';
import { getRunStatusInfo } from '@/shared/tailwind-ui';

export interface ConclusionProps {
	status: RUN_STATUS;
}

export const Conclusion: FC<ConclusionProps> = ({ status }) => {
	const { bg, color, icon, label } = getRunStatusInfo(status);

	return (
		<div
			className={`flex items-center w-fit gap-1 rounded py-0.5 px-1.5 ${bg} ${color}`}
		>
			{icon}
			<span className="text-[0.625rem] font-medium leading-[0.75rem]">
				{label}
			</span>
		</div>
	);
};
