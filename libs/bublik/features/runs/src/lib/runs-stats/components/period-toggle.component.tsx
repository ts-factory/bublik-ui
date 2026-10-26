/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import * as ToggleGroup from '@radix-ui/react-toggle-group';

import { ButtonTw } from '@/shared/tailwind-ui';

import { RUNS_CHART_PERIODS, RunsChartPeriod } from '../runs-stats.utils';

const PERIOD_LABELS: Record<RunsChartPeriod, string> = {
	day: 'Day',
	week: 'Week',
	month: 'Month'
};

interface PeriodToggleProps {
	period: RunsChartPeriod;
	onPeriodChange: (period: RunsChartPeriod) => void;
}

function PeriodToggle({ period, onPeriodChange }: PeriodToggleProps) {
	return (
		<ToggleGroup.Root
			type="single"
			value={period}
			// Radix sends an empty value when the pressed item is clicked again
			onValueChange={(value) => {
				if (value) onPeriodChange(value as RunsChartPeriod);
			}}
			className="flex items-center gap-1"
			aria-label="Group runs by"
		>
			{RUNS_CHART_PERIODS.map((value) => (
				<ToggleGroup.Item key={value} value={value} asChild>
					<ButtonTw
						variant={value === period ? 'primary' : 'secondary'}
						size="xss"
						className="uppercase"
					>
						{PERIOD_LABELS[value]}
					</ButtonTw>
				</ToggleGroup.Item>
			))}
		</ToggleGroup.Root>
	);
}

export { PERIOD_LABELS, PeriodToggle };
