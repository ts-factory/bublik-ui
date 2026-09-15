/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { CSSProperties } from 'react';

import { cn } from '@/shared/tailwind-ui';

import {
	COVERAGE_CLASSES,
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
		<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.6875rem] font-medium leading-[0.875rem] text-text-menu">
			{mode === 'result' ? (
				<>
					<span className="flex items-center gap-1.5">
						<Swatch className={RESULT_CLASSES.expected} /> expected
					</span>
					<span className="flex items-center gap-1.5">
						<Swatch className={RESULT_CLASSES.unexpected} /> unexpected
					</span>
				</>
			) : (
				<span className="flex items-center gap-1">
					{COVERAGE_CLASSES.map((cls) => (
						<Swatch key={cls} className={cls} />
					))}
					<span className="ml-1">iterations →</span>
				</span>
			)}
			<span className="flex items-center gap-1.5">
				<Swatch className="border-dashed" /> filtered out (exists elsewhere)
			</span>
			<span className="flex items-center gap-1.5">
				<Swatch className="bg-badge-0" style={NOT_OBSERVED_STYLE} /> n/a (not
				observed)
			</span>
			{mode === 'result' ? (
				<span>· Mixed cells show the count; hover for the split</span>
			) : null}
		</div>
	);
}
