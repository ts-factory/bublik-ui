/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';

import { Icon, Tooltip } from '@/shared/tailwind-ui';
import { DASHBOARD_MODE } from '@/shared/types';

const ToggleGroup = ToggleGroupPrimitive.Root;
const ToggleGroupItem = ToggleGroupPrimitive.Item;

export type ModePickerProps = ToggleGroupPrimitive.ToggleGroupSingleProps;

export const ModePicker = (props: ModePickerProps) => {
	return (
		<ToggleGroup className="flex" aria-label="Dashboard mode" {...props}>
			<Tooltip content="Single day, one column">
				<span>
					<ToggleGroupItem
						className="px-[0.625rem] border-y border-y-border-primary rounded-l-md border-l border-l-border-primary text-border-primary flex items-center justify-center cursor-pointer hover:text-primary rdx-state-on:text-primary focus-visible:shadow-[0_0_0_2px_rgba(98_126_251_0.75)] py-[7px]"
						value={DASHBOARD_MODE.Rows}
						aria-label="Mode rows"
					>
						<Icon name="LayoutLogHeader" />
					</ToggleGroupItem>
				</span>
			</Tooltip>
			<Tooltip content="Single day, two columns">
				<span>
					<ToggleGroupItem
						className="px-[0.625rem] border-y border-y-border-primary text-border-primary flex items-center justify-center cursor-pointer hover:text-primary rdx-state-on:text-primary focus-visible:shadow-[0_0_0_2px_rgba(98_126_251_0.75)] py-[7px]"
						value={DASHBOARD_MODE.RowsLine}
						aria-label="Mode rows line"
					>
						<Icon name="DashboardModeRowsLine" />
					</ToggleGroupItem>
				</span>
			</Tooltip>

			<Tooltip content="Two days, one column per day">
				<span>
					<ToggleGroupItem
						className="px-[0.625rem] border-y border-y-border-primary rounded-r-md border-r border-r-border-primary text-border-primary flex items-center justify-center cursor-pointer hover:text-primary rdx-state-on:text-primary focus-visible:shadow-[0_0_0_2px_rgba(98_126_251_0.75)] py-[7px]"
						value={DASHBOARD_MODE.Columns}
						aria-label="Mode columns"
					>
						<Icon name="DashboardModeColumns" />
					</ToggleGroupItem>
				</span>
			</Tooltip>
		</ToggleGroup>
	);
};
