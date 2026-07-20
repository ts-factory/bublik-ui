/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	ReactNode,
	createContext,
	useContext,
	useRef,
	useState
} from 'react';
import { BrainIcon, ChevronDownIcon } from 'lucide-react';

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn
} from '@/shared/tailwind-ui';

import { Shimmer } from './shimmer';
import { Response } from './response';

interface ReasoningContextValue {
	isStreaming: boolean;
	isOpen: boolean;
	/** Seconds the model spent thinking; null for persisted history (no timing). */
	duration: number | null;
}

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

function useReasoning(): ReasoningContextValue {
	const ctx = useContext(ReasoningContext);
	if (!ctx) throw new Error('useReasoning must be used within <Reasoning>');
	return ctx;
}

/**
 * Collapsible thinking block. The user toggles it manually; auto-open/duration
 * tracking is intentionally deferred (the part carries no timestamps, and the
 * streaming lifecycle is already surfaced via the shimmer in the trigger).
 */
export function Reasoning({
	isStreaming,
	className,
	children
}: {
	isStreaming: boolean;
	className?: string;
	children: ReactNode;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const hasUserToggled = useRef(false);

	return (
		<ReasoningContext.Provider value={{ isStreaming, isOpen, duration: null }}>
			<Collapsible
				open={isOpen}
				onOpenChange={(open) => {
					hasUserToggled.current = true;
					setIsOpen(open);
				}}
				className={cn(className)}
			>
				{children}
			</Collapsible>
		</ReasoningContext.Provider>
	);
}

export function ReasoningTrigger({ className }: { className?: string }) {
	const { isStreaming, isOpen, duration } = useReasoning();

	return (
		<CollapsibleTrigger
			className={cn(
				'flex items-center gap-2 text-[0.8125rem] text-text-secondary hover:text-text-primary',
				className
			)}
		>
			<BrainIcon className="size-4" />
			{isStreaming ? (
				<Shimmer>Thinking…</Shimmer>
			) : duration !== null ? (
				<span>Thought for {duration}s</span>
			) : (
				<span>Reasoning</span>
			)}
			<ChevronDownIcon
				className={cn('size-4 transition-transform', isOpen && 'rotate-180')}
			/>
		</CollapsibleTrigger>
	);
}

export function ReasoningContent({
	children,
	className
}: {
	children: string;
	className?: string;
}) {
	return (
		<CollapsibleContent className={className}>
			<div className="mt-2 border-l-2 border-border-primary pl-3 text-[0.8125rem] text-text-secondary">
				<Response>{children}</Response>
			</div>
		</CollapsibleContent>
	);
}
