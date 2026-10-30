/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ReactNode } from 'react';

import { Icon } from '../icon';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { cn } from '../utils';

const DEFAULT_EXAMPLES = [
	'medford & !pci-15b3',
	'pci-15b3 | pci-sub-15b3',
	'(conclusion: stopped | conclusion: busy) & device: lab-host-01'
];

interface MetaFilterHelpProps {
	/** What a bare name means here: "run has the tag", "iteration has the parameter". */
	noun?: string;
	examples?: readonly string[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	className?: string;
}

function Code({
	children,
	wrap = false
}: {
	children: ReactNode;
	/** An example can be longer than the popover is wide. */
	wrap?: boolean;
}) {
	return (
		<code
			className={cn(
				'w-fit rounded bg-badge-0 px-1 py-px font-mono text-xs font-medium text-text-primary',
				wrap ? '[overflow-wrap:anywhere]' : 'whitespace-nowrap'
			)}
		>
			{children}
		</code>
	);
}

function Warning({ children }: { children: ReactNode }) {
	return (
		<div className="mt-1.5 flex gap-2 rounded-md bg-badge-0 px-2.5 py-2">
			<span aria-hidden="true">⚠</span>
			<span>{children}</span>
		</div>
	);
}

/**
 * The expression grammar in one glance, with the two backend surprises:
 * comparisons are text comparisons, and `!=`, as `!name=value`, matches runs
 * that have the name with another value. Static, no data; opens from the
 * `?` beside the label.
 */
function MetaFilterHelp({
	noun = 'tag',
	examples = DEFAULT_EXAMPLES,
	open,
	onOpenChange,
	className
}: MetaFilterHelpProps) {
	const operators: [ReactNode, ReactNode][] = [
		[<Code>name</Code>, `run has the ${noun}`],
		[
			<Code>name: value</Code>,
			<>
				exact value; <Code>name=value</Code> works too
			</>
		],
		[
			<Code>name!=value</Code>,
			<>
				has <i>name</i> with another value
			</>
		],
		[
			<Code>name &gt; 100</Code>,
			<>
				also <Code>&lt;</Code> <Code>&lt;=</Code> <Code>&gt;=</Code>
			</>
		],
		[<Code>!a</Code>, 'not'],
		[<Code>a &amp; b</Code>, 'and (binds tighter than or)'],
		[<Code>a | b</Code>, 'or'],
		[<Code>( … )</Code>, 'group']
	];

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>
				<button
					type="button"
					aria-label="Expression syntax help"
					className={cn(
						'inline-flex size-5 items-center justify-center rounded text-text-menu transition-colors hover:bg-primary-wash hover:text-primary',
						open && 'bg-primary-wash text-primary',
						className
					)}
				>
					<Icon name="InformationCircleQuestionMark" size={16} />
				</button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				sideOffset={6}
				aria-label="Expression syntax"
				className="z-[60] w-[440px] max-w-[calc(100vw-32px)] rounded-lg bg-bg-elevated px-4 py-3 text-sm leading-normal text-text-secondary shadow-popover"
			>
				<h3 className="mb-2.5 text-sm font-semibold text-text-primary">
					Writing expressions
				</h3>
				<dl className="grid grid-cols-[150px_minmax(0,1fr)] gap-x-3 gap-y-1">
					{operators.map(([syntax, meaning], index) => (
						<div key={index} className="contents">
							<dt>{syntax}</dt>
							<dd>{meaning}</dd>
						</div>
					))}
				</dl>
				<h4 className="mb-1 mt-3 text-xs font-medium text-text-menu">
					Names and values
				</h4>
				<div>
					Letters, digits and <Code>. _ - / % + :</Code> only. Spaces only
					around operators; no quotes. A value with other characters, such as{' '}
					<Code>payload_len: [0,1200]</Code>, works as an exact value: pairs
					joined only with <Code>&amp;</Code> become value chips.
				</div>
				<h4 className="mb-1 mt-3 text-xs font-medium text-text-menu">
					Examples
				</h4>
				<div className="flex flex-col items-start gap-1">
					{examples.map((example) => (
						<Code key={example} wrap>
							{example}
						</Code>
					))}
				</div>
				<Warning>
					<Code>&lt;</Code> and <Code>&gt;</Code> compare as <b>text</b>:{' '}
					<Code>pkt_size &gt; 100</Code> also matches <Code>pkt_size: 9</Code>.
				</Warning>
				<Warning>
					<Code>pci!=15b3</Code>, and <Code>!pci=15b3</Code> alike, only match
					runs that <b>have</b> <Code>pci</Code> with another value; runs
					without <Code>pci</Code> are left out.
				</Warning>
				<p className="mt-3 text-xs text-text-menu">
					Each chip is ANDed with the others.
				</p>
			</PopoverContent>
		</Popover>
	);
}

export { MetaFilterHelp };
export type { MetaFilterHelpProps };
