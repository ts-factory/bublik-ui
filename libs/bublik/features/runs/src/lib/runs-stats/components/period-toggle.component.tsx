/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import * as ToggleGroup from '@radix-ui/react-toggle-group';

import { ButtonTw, Icon, IconProps, Tooltip } from '@/shared/tailwind-ui';

import { RUNS_CHART_PERIODS, RunsChartPeriod } from '../runs-stats.utils';

const PERIOD_LABELS: Record<RunsChartPeriod, string> = {
	day: 'Day',
	week: 'Week',
	month: 'Month'
};

const PERIOD_HINTS: Record<RunsChartPeriod, string> = {
	day: 'One bar per day',
	week: 'One bar per week, Monday to Sunday',
	month: 'One bar per calendar month'
};

const PERIOD_ICONS = {
	day: 'CalendarDay',
	week: 'CalendarWeek',
	month: 'CalendarMonth'
} as const satisfies Record<RunsChartPeriod, IconProps['name']>;

interface PeriodToggleProps {
	period: RunsChartPeriod;
	onPeriodChange: (period: RunsChartPeriod) => void;
}

function PeriodToggle({ period, onPeriodChange }: PeriodToggleProps) {
	return (
		<div className="flex items-center gap-2">
			<span
				id="runs-charts-group-by"
				className="text-xs font-medium text-text-primary"
			>
				Group by
			</span>
			<ToggleGroup.Root
				type="single"
				value={period}
				// Radix sends an empty value when the pressed item is clicked again
				onValueChange={(value) => {
					if (value) onPeriodChange(value as RunsChartPeriod);
				}}
				className="flex items-center gap-1"
				aria-labelledby="runs-charts-group-by"
			>
				{RUNS_CHART_PERIODS.map((value) => (
					<Tooltip key={value} content={PERIOD_HINTS[value]}>
						<ToggleGroup.Item value={value} asChild>
							<ButtonTw
								variant={value === period ? 'primary' : 'secondary'}
								size="xss"
								className="gap-1"
							>
								<Icon name={PERIOD_ICONS[value]} size={20} />
								{PERIOD_LABELS[value]}
							</ButtonTw>
						</ToggleGroup.Item>
					</Tooltip>
				))}
			</ToggleGroup.Root>
		</div>
	);
}

export { PERIOD_LABELS, PeriodToggle };
