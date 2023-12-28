/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentProps } from 'react';

import { ToggleSwitch, Tooltip } from '@/shared/tailwind-ui';

type AutoReloadToggleProps = ComponentProps<typeof ToggleSwitch>;

export const AutoReloadToggle = (props: AutoReloadToggleProps) => {
	return (
		<Tooltip content="Reload page every 30 seconds" side="bottom">
			<div>
				<ToggleSwitch label="Auto reload" {...props} />
			</div>
		</Tooltip>
	);
};
