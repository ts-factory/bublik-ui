/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { CSSProperties } from 'react';

import { Tooltip, cn } from '@/shared/tailwind-ui';

import {
	COVERAGE_CLASSES,
	MIXED_CLASSES,
	NOT_OBSERVED_STYLE,
	RESULT_CLASSES
} from './matrix-table';
import { MatrixCellMode } from './result-view.hooks';

function Swatch(props: { className?: string; style?: CSSProperties }) {
	return (
		<i
			className={cn(
				'inline-block size-3 rounded-sm border border-border-primary align-middle',
				props.className
			)}
			style={props.style}
		/>
	);
}

export function MatrixLegend({ mode }: { mode: MatrixCellMode }) {
	return (
		// Its items join the footer's row (`contents`), so a narrow footer
		// wraps them one by one after the coverage, not the whole legend at
		// once; each item stays on one line.
		<div className="contents whitespace-nowrap text-[0.625rem] font-semibold uppercase tracking-wide leading-[0.875rem] text-text-menu">
			{mode === 'result' ? (
				<>
					<span className="flex items-center gap-1.5">
						<Swatch className={RESULT_CLASSES.expected} /> expected
					</span>
					<span className="flex items-center gap-1.5">
						<Swatch className={RESULT_CLASSES.unexpected} /> unexpected
					</span>
					<Tooltip content="Mixed cells show unexpected / total; the redder, the larger the unexpected share">
						<span className="flex items-center gap-1">
							{MIXED_CLASSES.map((cls) => (
								<Swatch key={cls} className={cls} />
							))}
							<span className="ml-1">mixed →</span>
						</span>
					</Tooltip>
				</>
			) : (
				<span className="flex items-center gap-1">
					{COVERAGE_CLASSES.map((cls) => (
						<Swatch key={cls} className={cls} />
					))}
					<span className="ml-1">iterations →</span>
				</span>
			)}
			{/* Short labels keep the legend on one row; what each means is on
			    hover. */}
			<Tooltip content="The combination exists in other iterations, but the current filters leave it out">
				<span className="flex items-center gap-1.5">
					<Swatch className="border-dashed" /> filtered out
				</span>
			</Tooltip>
			<Tooltip content="The combination never occurs in any iteration">
				<span className="flex items-center gap-1.5">
					<Swatch className="bg-badge-0" style={NOT_OBSERVED_STYLE} /> not
					observed
				</span>
			</Tooltip>
			<span className="normal-case font-medium">
				Click a cell to inspect its iterations
			</span>
		</div>
	);
}
