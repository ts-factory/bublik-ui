/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { ReactNode } from 'react';

import { cn } from '@/shared/tailwind-ui';

import { RunsChartSummary } from '../runs-stats.component.utils';

const number = new Intl.NumberFormat('en');

const formatPercent = (value: number | null) =>
	value === null ? '–' : `${value.toFixed(1)}%`;

interface SummaryTileProps {
	label: string;
	value: string;
	hint?: ReactNode;
	valueClassName?: string;
}

function SummaryTile({ label, value, hint, valueClassName }: SummaryTileProps) {
	return (
		<div className="flex flex-col gap-1 px-4 py-3">
			<span className="text-[0.6875rem] font-semibold leading-[0.875rem] uppercase text-text-menu">
				{label}
			</span>
			<span
				className={cn(
					'text-2xl font-semibold leading-8 tabular-nums text-text-primary',
					valueClassName
				)}
			>
				{value}
			</span>
			{hint ? (
				<span className="text-xs leading-4 text-text-secondary">{hint}</span>
			) : null}
		</div>
	);
}

interface SummaryTilesProps {
	summary: RunsChartSummary;
}

function SummaryTiles({ summary }: SummaryTilesProps) {
	const { runs, tests, ok, nok, passrate } = summary;

	return (
		<div
			className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border-primary"
			data-testid="runs-stats-summary"
		>
			<SummaryTile label="Runs" value={number.format(runs)} />
			<SummaryTile label="Tests" value={number.format(tests)} />
			<SummaryTile
				label="Pass rate"
				value={formatPercent(passrate)}
				hint={`${number.format(ok)} OK`}
			/>
			<SummaryTile
				label="NOK"
				value={number.format(nok)}
				hint={tests ? `${formatPercent((nok * 100) / tests)} of tests` : null}
				valueClassName={nok ? 'text-text-unexpected' : undefined}
			/>
		</div>
	);
}

export { SummaryTiles };
