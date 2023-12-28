/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { RUN_STATUS } from '@/shared/types';
import { getRunStatusInfo, Tooltip } from '@/shared/tailwind-ui';

export interface RunStatusIconProps {
	runStatus: RUN_STATUS;
}

export const RunIcon = ({ runStatus }: RunStatusIconProps) => {
	const { icon, color, bg, label } = getRunStatusInfo(runStatus);

	return (
		<Tooltip content={`Conclusion: ${label}`} side="top">
			<div
				className={`flex items-center z-20 justify-center w-full absolute -top-px -left-px rounded-l-md ${color} ${bg}`}
				style={{ height: 'calc(100% + 2px)' }}
			>
				{icon}
			</div>
		</Tooltip>
	);
};
