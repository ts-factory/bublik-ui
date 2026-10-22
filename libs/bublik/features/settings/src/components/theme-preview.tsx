/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ResolvedTheme } from '@/shared/hooks';
import { cn } from '@/shared/tailwind-ui';

const ROWS = [
	{ stripe: 'bg-bg-ok', chip: 'bg-badge-3', bar: 'w-3/5' },
	{ stripe: 'bg-bg-error', chip: 'bg-bg-fillError', bar: 'w-2/5' },
	{ stripe: 'bg-bg-warning', chip: 'bg-badge-14', bar: 'w-1/2' },
	{ stripe: 'bg-bg-running', chip: 'bg-badge-1', bar: 'w-1/3' }
];

interface ThemeMockProps {
	theme: ResolvedTheme;
	className?: string;
}

/**
 * A miniature of the app (sidebar, toolbar, a table of runs) drawn with the
 * real tokens of one theme. `.theme-light` / `.theme-dark` pin the subtree, so
 * it shows that theme whatever the page is in.
 */
function ThemeMock({ theme, className }: ThemeMockProps) {
	return (
		<div
			aria-hidden
			className={cn(
				theme === 'dark' ? 'theme-dark' : 'theme-light',
				'flex bg-bg-body text-text-primary',
				className
			)}
		>
			<div className="flex w-[22%] flex-col gap-1.5 p-1.5">
				<div className="h-1.5 w-3/4 rounded-full bg-primary" />
				<div className="mt-1 h-2.5 rounded bg-primary" />
				{[0, 1, 2].map((item) => (
					<div
						key={item}
						className="h-1.5 w-4/5 rounded-full bg-text-menu/40"
					/>
				))}
			</div>
			<div className="my-1.5 mr-1.5 flex flex-1 flex-col gap-1 overflow-hidden rounded bg-bg-primary p-1.5">
				<div className="flex items-center gap-1">
					<div className="h-2.5 flex-1 rounded-sm border border-border-input" />
					<div className="h-2.5 w-5 rounded-sm bg-primary" />
				</div>
				{ROWS.map((row, idx) => (
					<div
						key={idx}
						className="flex h-3.5 items-center gap-1 overflow-hidden rounded-sm bg-primary-wash"
					>
						<div className={cn('h-full w-1', row.stripe)} />
						<div
							className={cn('h-1 rounded-full bg-text-primary/70', row.bar)}
						/>
						<div className={cn('ml-auto mr-1 h-2 w-3 rounded-sm', row.chip)} />
					</div>
				))}
			</div>
		</div>
	);
}

/** The light mock with the dark one over its lower-right half, for System */
function SystemMock({ className }: { className?: string }) {
	return (
		<div aria-hidden className={cn('relative', className)}>
			<ThemeMock theme="light" className="absolute inset-0" />
			<ThemeMock
				theme="dark"
				className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)]"
			/>
		</div>
	);
}

export { ThemeMock, SystemMock };
