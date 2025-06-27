/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentProps, PropsWithChildren } from 'react';
import { To } from 'react-router-dom';

import { LinkWithProject } from '@/bublik/features/projects';
import { cn, HoverCard, HoverCardProps, Icon } from '@/shared/tailwind-ui';

type LinkItem = { label: string; to: To; state?: Record<string, unknown> };
export type ContextLinksSection = { label: string; items: LinkItem[] };

type ContextLinksProps = Omit<HoverCardProps, 'content'> & {
	sections: ContextLinksSection[];
};

export const ContextLinks = ({
	children,
	sections,
	...props
}: PropsWithChildren<ContextLinksProps>) => {
	return (
		<HoverCard
			content={
				<div className="flex flex-col gap-3 p-3 bg-white rounded-xl shadow-popover min-w-[200px]">
					{sections.map((section) => (
						<Section key={section.label} {...section} />
					))}
				</div>
			}
			{...props}
		>
			{children}
		</HoverCard>
	);
};

const SectionLabel = ({ className, ...props }: ComponentProps<'div'>) => {
	return (
		<div
			className={cn(
				'px-4 py-1 text-text-menu text-[0.6875rem] font-semibold leading-[0.875rem]',
				className
			)}
			{...props}
		/>
	);
};

type SectionListProps = ContextLinksSection;

const Section = ({ label, items }: SectionListProps) => {
	return (
		<div className="flex flex-col gap-2">
			<SectionLabel>{label}</SectionLabel>
			<ul className="flex flex-col gap-2">
				{items.map((linkItem) => (
					<li key={linkItem.label}>
						<LinkItem {...linkItem} />
					</li>
				))}
			</ul>
		</div>
	);
};

type LinkItemProps = LinkItem;

const LinkItem = ({ to, label, state }: LinkItemProps) => {
	return (
		<LinkWithProject
			className="flex items-center justify-between gap-4 px-4 py-2 transition-all rounded text-text-secondary hover:text-primary hover:bg-primary-wash focus:bg-primary-wash focus:text-primary group"
			to={to}
			state={state}
			target="_blank"
		>
			<span className="text-[0.75rem] font-semibold">{label}</span>
			<Icon
				name="ArrowShortTop"
				className="rotate-90 text-text-menu group-hover:text-primary group-focus:text-primary"
			/>
		</LinkWithProject>
	);
};
