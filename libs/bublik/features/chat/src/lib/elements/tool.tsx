/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ReactNode } from 'react';
import {
	CheckCircle2Icon,
	ChevronDownIcon,
	WrenchIcon,
	XCircleIcon
} from 'lucide-react';

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn
} from '@/shared/tailwind-ui';

import { Shimmer } from './shimmer';
import { type ToolStatus } from './part-state';

export function Tool({
	className,
	children,
	defaultOpen
}: {
	className?: string;
	children: ReactNode;
	defaultOpen?: boolean;
}) {
	return (
		<Collapsible
			defaultOpen={defaultOpen}
			className={cn(
				'rounded-md border border-border-primary bg-white/70',
				className
			)}
		>
			{children}
		</Collapsible>
	);
}

function ToolStatusBadge({ status }: { status: ToolStatus }) {
	switch (status) {
		case 'running':
			return <Shimmer>Running…</Shimmer>;
		case 'complete':
			return (
				<span className="flex items-center gap-1 text-text-secondary">
					<CheckCircle2Icon className="size-3.5 text-bg-ok" />
					Completed
				</span>
			);
		case 'error':
			return (
				<span className="flex items-center gap-1 text-text-secondary">
					<XCircleIcon className="size-3.5 text-bg-error" />
					Error
				</span>
			);
	}
}

export function ToolHeader({
	name,
	status,
	className
}: {
	name: string;
	status: ToolStatus;
	className?: string;
}) {
	return (
		<CollapsibleTrigger
			className={cn(
				'group flex w-full items-center gap-2 px-2 py-1.5 text-[0.75rem] font-medium text-text-primary',
				className
			)}
		>
			<WrenchIcon className="size-3.5 text-text-menu" />
			<span className="font-mono">{name}</span>
			<ToolStatusBadge status={status} />
			<ChevronDownIcon className="ml-auto size-3.5 transition-transform group-rdx-state-open:rotate-180" />
		</CollapsibleTrigger>
	);
}

export function ToolContent({
	className,
	children
}: {
	className?: string;
	children: ReactNode;
}) {
	return (
		<CollapsibleContent className={className}>
			<div className="flex flex-col gap-1.5 px-2 pb-2 text-[0.7188rem]">
				{children}
			</div>
		</CollapsibleContent>
	);
}

function prettyJson(value: string): string {
	try {
		return JSON.stringify(JSON.parse(value), null, 2);
	} catch {
		return value;
	}
}

export function ToolInput({ input }: { input: string }) {
	if (!input) return null;
	return (
		<div>
			<span className="mb-0.5 block text-[0.6875rem] font-semibold uppercase tracking-wide text-text-secondary">
				Parameters
			</span>
			<pre className="overflow-x-auto rounded bg-primary-wash p-1.5">
				{prettyJson(input)}
			</pre>
		</div>
	);
}

export function ToolOutput({
	output,
	errorText
}: {
	output: unknown;
	errorText?: string;
}) {
	if (output === undefined && !errorText) return null;
	return (
		<div>
			<span className="mb-0.5 block text-[0.6875rem] font-semibold uppercase tracking-wide text-text-secondary">
				{errorText ? 'Error' : 'Result'}
			</span>
			{errorText ? (
				<pre className="overflow-x-auto rounded bg-bg-error/10 p-1.5 text-bg-error">
					{errorText}
				</pre>
			) : (
				<pre className="overflow-x-auto rounded bg-primary-wash p-1.5">
					{typeof output === 'string'
						? output
						: JSON.stringify(output, null, 2)}
				</pre>
			)}
		</div>
	);
}
