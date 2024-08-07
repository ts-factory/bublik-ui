/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { RUN_STATUS } from '@/shared/types';
import { ConclusionHoverCard, getRunStatusInfo } from '@/shared/tailwind-ui';

export interface RunStatusIconProps {
	runStatus: RUN_STATUS;
	conclusionReason?: string | null;
}

function RunIcon({ runStatus, conclusionReason }: RunStatusIconProps) {
	const { icon, color, bg } = getRunStatusInfo(runStatus);

	return (
		<ConclusionHoverCard
			conclusion={runStatus}
			conclusionReason={conclusionReason}
			side="right"
		>
			<div
				className={`flex items-center z-20 justify-center w-full absolute -top-px -left-px rounded-l-md ${color} ${bg}`}
				style={{ height: 'calc(100% + 2px)' }}
			>
				{icon}
			</div>
		</ConclusionHoverCard>
	);
}

export { RunIcon };
