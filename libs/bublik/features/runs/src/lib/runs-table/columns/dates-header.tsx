/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import { Icon, Tooltip } from '@/shared/tailwind-ui';

export const DatesHeader: FC = () => {
	return (
		<div className="flex items-center gap-1">
			<Tooltip content="Time zone: UTC">
				<Icon
					name="InformationCircleQuestionMark"
					size={16}
					className="grid place-items-center text-primary"
				/>
			</Tooltip>
			<span>Dates</span>
		</div>
	);
};
