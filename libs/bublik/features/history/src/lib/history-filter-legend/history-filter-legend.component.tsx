/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Badge, BadgeVariants, Icon, IconProps } from '@/shared/tailwind-ui';

const LegendItemValue = ({ value }: { value?: LegendItemProps['value'] }) => {
	if (!value || !value.length) {
		return (
			<Badge variant={BadgeVariants.Primary} className="bg-primary-wash">
				<span className="text-[0.6875rem] leading-[0.875rem] text-text-secondary">
					&#8212;
				</span>
			</Badge>
		);
	}

	if (!Array.isArray(value)) {
		return (
			<Badge variant={BadgeVariants.Primary} className="bg-primary-wash">
				<span className="text-[0.6875rem] leading-[0.875rem] text-text-secondary">
					{value}
				</span>
			</Badge>
		);
	}

	return (
		<>
			{value.map((value) => (
				<Badge
					key={value}
					variant={BadgeVariants.Primary}
					className="bg-primary-wash"
				>
					<span className="text-[0.6875rem] leading-[0.875rem] text-text-secondary">
						{value}
					</span>
				</Badge>
			))}
		</>
	);
};

export type LegendItem = {
	label: string;
	iconName: IconProps['name'];
	iconSize: number;
	value?: string | string[] | null;
};

export type LegendItemProps = LegendItem;

export const LegendItem = ({
	label,
	value,
	iconName,
	iconSize
}: LegendItemProps) => {
	return (
		<div className="flex items-center justify-center gap-2 px-2.5 py-1.5 rounded border border-border-primary">
			<div className="flex items-center gap-1.5 flex-shrink-0 text-text-menu ">
				<Icon
					name={iconName}
					size={iconSize}
					className="grid place-items-center text-text-menu"
				/>
				<span className="text-[0.75rem] font-semibold leading-[0.875rem] text-text-secondary">
					{label}:
				</span>
			</div>
			<div className="flex flex-wrap items-center gap-3">
				<LegendItemValue value={value} />
			</div>
		</div>
	);
};

LegendItem.displayName = 'LegendItem';

export interface LegendProps {
	items: LegendItem[];
}

export const HistoryFilterLegend = ({ items }: LegendProps) => {
	return (
		<div className="flex flex-wrap items-center gap-4">
			{items.map(({ label, iconName, value, iconSize }) => (
				<LegendItem
					key={label}
					label={label}
					iconSize={iconSize}
					iconName={iconName}
					value={value}
				/>
			))}
		</div>
	);
};

HistoryFilterLegend.displayName = 'HistoryFilterLegend';
