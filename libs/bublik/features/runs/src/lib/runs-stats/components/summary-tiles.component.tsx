/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { ReactNode } from 'react';

import { Tooltip, cn, getRunStatusInfo } from '@/shared/tailwind-ui';
import { RUN_STATUS } from '@/shared/types';

import { RunsChartSummary } from '../runs-stats.component.utils';

const number = new Intl.NumberFormat('en');

const TILE_LABEL =
	'text-[0.6875rem] font-semibold leading-[0.875rem] uppercase text-text-menu';

const formatPercent = (value: number | null) =>
	value === null ? '–' : `${value.toFixed(1)}%`;

const TILE_VALUE =
	'text-xl font-semibold leading-7 tabular-nums text-text-primary';

interface SummaryTileProps {
	label: string;
	value: string;
	hint?: ReactNode;
	valueClassName?: string;
}

function SummaryTile(props: SummaryTileProps) {
	const { label, value, hint, valueClassName } = props;

	return (
		<div className="flex flex-col gap-0.5 px-4 py-2 min-w-0">
			<span className={TILE_LABEL}>{label}</span>
			<span className={cn(TILE_VALUE, valueClassName)}>{value}</span>
			{hint ? (
				<span className="text-xs leading-4 text-text-secondary">{hint}</span>
			) : null}
		</div>
	);
}

interface ConclusionCount {
	status: RUN_STATUS;
	count: number;
}

/** "ok" reads as OK, the rest in sentence case: "Warning" */
function getConclusionName(status: RUN_STATUS): string {
	const { label } = getRunStatusInfo(status);

	return status === RUN_STATUS.Ok
		? label.toUpperCase()
		: label.charAt(0).toUpperCase() + label.slice(1);
}

interface ConclusionBreakdownProps {
	conclusions: ConclusionCount[];
	onSelect: (status: RUN_STATUS) => void;
}

const formatRuns = (count: number) =>
	`${count} ${count === 1 ? 'run' : 'runs'}`;

/** Runs by conclusion over the whole range; each conclusion lists its runs */
function ConclusionBreakdown({
	conclusions,
	onSelect
}: ConclusionBreakdownProps) {
	const total = conclusions.reduce((sum, { count }) => sum + count, 0);

	if (!total) return null;

	return (
		<div className="flex flex-col flex-1 gap-2 min-w-0 pt-[3px]">
			{/* The legend below is the accessible way in; the segments repeat it */}
			<div
				className="flex h-2 gap-0.5 overflow-hidden rounded"
				aria-hidden="true"
			>
				{conclusions.map(({ status, count }) => (
					<Tooltip
						key={status}
						content={`${getConclusionName(status)}: ${formatRuns(count)}`}
					>
						<button
							type="button"
							tabIndex={-1}
							onClick={() => onSelect(status)}
							className="transition-opacity hover:opacity-70"
							style={{
								flex: `${count} 0 0`,
								background: getRunStatusInfo(status).bgRaw
							}}
						/>
					</Tooltip>
				))}
			</div>
			{/* Cells of one width, the badge at the start and the numbers at
			    the end, so the counts line up down each column */}
			<ul
				className="grid grid-cols-[repeat(auto-fill,minmax(12.5rem,1fr))] gap-1.5"
				aria-label="Runs by conclusion"
			>
				{conclusions.map(({ status, count }) => {
					const name = getConclusionName(status);
					const { label, bg, color, icon } = getRunStatusInfo(status);

					return (
						<li key={status}>
							<button
								type="button"
								onClick={() => onSelect(status)}
								className="group grid grid-cols-[minmax(0,1fr)_auto_auto_2rem] items-center w-full p-1 pr-2 rounded-md bg-primary-wash text-xs leading-4 tabular-nums whitespace-nowrap text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
								aria-label={`${name}: ${formatRuns(count)}`}
							>
								{/* The ConclusionBadge of the run page; that one renders a div */}
								<span
									className={cn(
										'inline-flex items-center justify-self-start gap-1 rounded py-0.5 px-1.5 text-[0.625rem] font-medium leading-[0.75rem] uppercase',
										bg,
										color
									)}
								>
									{icon}
									{label}
								</span>
								<span className="pl-2 font-semibold text-right text-text-primary group-hover:text-primary">
									{count}
								</span>
								<span
									className="w-px h-4 mx-2 bg-border-separator"
									aria-hidden="true"
								/>
								<span className="text-right text-text-secondary group-hover:text-primary">
									{Math.round((count * 100) / total)}%
								</span>
							</button>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

interface SummaryTilesProps {
	summary: RunsChartSummary;
	conclusions: ConclusionCount[];
	onSelectConclusion: (status: RUN_STATUS) => void;
}

function SummaryTiles(props: SummaryTilesProps) {
	const { summary, conclusions, onSelectConclusion } = props;
	const { runs, tests, ok, nok, passrate } = summary;

	return (
		<div
			className="grid grid-cols-3 lg:grid-cols-[minmax(0,4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] divide-x divide-border-primary"
			data-testid="runs-stats-summary"
		>
			{/* The breakdown sits beside the count, so the tile is no taller */}
			<div className="flex col-span-3 gap-6 px-4 py-2 min-w-0 lg:col-span-1">
				<div className="flex flex-col gap-0.5 shrink-0">
					<span className={TILE_LABEL}>Runs</span>
					<span className={TILE_VALUE}>{number.format(runs)}</span>
				</div>
				<ConclusionBreakdown
					conclusions={conclusions}
					onSelect={onSelectConclusion}
				/>
			</div>
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
