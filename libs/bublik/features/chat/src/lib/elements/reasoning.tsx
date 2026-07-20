/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	ReactNode,
	createContext,
	useContext,
	useEffect,
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
 * Collapsible thinking block. Auto-opens while the model streams reasoning and
 * auto-closes shortly after it finishes — unless the user toggled it manually,
 * after which their choice wins. Duration is measured client-side (the part
 * carries no timestamps), so persisted history renders without it.
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
	const [duration, setDuration] = useState<number | null>(null);
	const hasUserToggled = useRef(false);
	const startRef = useRef<number | null>(null);

	// useEffect(() => {
	// 	if (isStreaming) {
	// 		if (startRef.current === null) startRef.current = Date.now();
	// 		if (!hasUserToggled.current) setIsOpen(true);
	// 		return;
	// 	}
	// 	if (startRef.current === null) return;
	// 	setDuration(
	// 		Math.max(1, Math.round((Date.now() - startRef.current) / 1000))
	// 	);
	// 	startRef.current = null;
	// 	if (hasUserToggled.current) return;
	// 	const timeout = setTimeout(() => setIsOpen(false), 1000);
	// 	return () => clearTimeout(timeout);
	// }, [isStreaming]);

	return (
		<ReasoningContext.Provider value={{ isStreaming, isOpen, duration }}>
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
