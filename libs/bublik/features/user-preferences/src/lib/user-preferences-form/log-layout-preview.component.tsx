/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { LogPageMode } from '@/shared/types';
import { cn } from '@/shared/tailwind-ui';

const LOG_LINES = ['w-4/5', 'w-3/5', 'w-2/3', 'w-1/2'];

interface LogLayoutPreviewProps {
	mode: LogPageMode;
}

/** A schematic of the log page's panes in one layout: tree, info and log. */
function LogLayoutPreview({ mode }: LogLayoutPreviewProps) {
	const hasTree =
		mode === LogPageMode.TreeAndInfoAndLog || mode === LogPageMode.TreeAndLog;
	const hasInfo =
		mode === LogPageMode.TreeAndInfoAndLog || mode === LogPageMode.InfoAndLog;

	return (
		<span className="flex h-16 w-full gap-1 rounded-md border border-border-primary bg-bg-body p-1">
			{hasTree ? (
				<span className="flex w-1/4 flex-col gap-1 rounded-sm bg-bg-primary p-1">
					{[0, 1, 2].map((item) => (
						<span
							key={item}
							className={cn(
								'h-1 rounded-full bg-text-menu/40',
								item === 1 ? 'ml-1' : ''
							)}
						/>
					))}
				</span>
			) : null}
			<span className="flex flex-1 flex-col gap-1">
				{hasInfo ? (
					<span className="flex h-4 shrink-0 items-center gap-1 rounded-sm bg-bg-primary px-1">
						<span className="h-1.5 w-1/3 rounded-full bg-primary/60" />
						<span className="h-1.5 w-1/5 rounded-full bg-text-menu/40" />
					</span>
				) : null}
				<span className="flex flex-1 flex-col gap-1 overflow-hidden rounded-sm bg-bg-primary p-1">
					{LOG_LINES.map((width) => (
						<span
							key={width}
							className={cn('h-1 shrink-0 rounded-full bg-text-menu/40', width)}
						/>
					))}
				</span>
			</span>
		</span>
	);
}

export { LogLayoutPreview };
export type { LogLayoutPreviewProps };
