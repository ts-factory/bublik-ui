/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { PageLayout } from '@/shared/hooks';
import { cn } from '@/shared/tailwind-ui';

interface LayoutMockProps {
	layout: PageLayout;
	className?: string;
}

/**
 * A miniature of a wide screen showing where the sidebar and the page sit in
 * one layout; the empty room beside a capped page is the gutter.
 */
function LayoutMock({ layout, className }: LayoutMockProps) {
	return (
		<div
			aria-hidden
			className={cn(
				'flex bg-bg-body p-1.5',
				layout === 'centered' && 'justify-center',
				className
			)}
		>
			<div className="flex w-[6%] shrink-0 flex-col gap-1 rounded-sm bg-bg-primary p-0.5">
				<div className="h-1.5 rounded-full bg-primary" />
				{[0, 1, 2].map((item) => (
					<div key={item} className="h-1 rounded-full bg-text-menu/40" />
				))}
			</div>
			<div
				className={cn(
					'flex',
					layout === 'centered' ? 'w-3/5' : 'flex-1',
					layout === 'sidebar-left' && 'justify-center'
				)}
			>
				<div
					className={cn(
						'ml-1 flex flex-col gap-1 rounded-sm bg-bg-primary p-1',
						layout === 'sidebar-left' ? 'w-3/4' : 'flex-1'
					)}
				>
					<div className="h-2 rounded-sm border border-border-input" />
					{[0, 1, 2, 3].map((row) => (
						<div key={row} className="h-2.5 rounded-sm bg-primary-wash" />
					))}
				</div>
			</div>
		</div>
	);
}

export { LayoutMock };
