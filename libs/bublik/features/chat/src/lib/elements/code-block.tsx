/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';
import ShikiHighlighter from 'react-shiki';

import { cn } from '@/shared/tailwind-ui';
import { useCopyToClipboard } from '@/shared/hooks';

interface CodeBlockProps {
	code: string;
	language: string;
	className?: string;
}

function CodeBlock({ code, language, className }: CodeBlockProps) {
	const [isCopied, setIsCopied] = useState(false);
	const timeoutRef = useRef<number>(0);
	const [, copy] = useCopyToClipboard();

	const handleCopy = useCallback(async () => {
		const success = await copy(code);
		if (success) {
			setIsCopied(true);
			timeoutRef.current = window.setTimeout(() => setIsCopied(false), 2000);
		}
	}, [code, copy]);

	useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

	return (
		<div
			className={cn(
				'my-1.5 overflow-hidden rounded-md border bg-background',
				className
			)}
		>
			<div className="flex items-center justify-between border-b bg-muted/80 px-3 py-1.5 text-muted-foreground text-xs">
				<span className="font-mono">{language}</span>
				<button
					onClick={handleCopy}
					className="flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors hover:bg-muted"
					type="button"
				>
					{isCopied ? (
						<>
							<CheckIcon size={14} className="shrink-0" />
							<span>Copied</span>
						</>
					) : (
						<CopyIcon size={14} className="shrink-0" />
					)}
				</button>
			</div>
			<ShikiHighlighter
				language={language}
				theme="github-light"
				addDefaultStyles={false}
				className="[&_pre]:m-0 [&_pre]:overflow-auto [&_pre]:p-3 [&_pre]:text-sm"
			>
				{code}
			</ShikiHighlighter>
		</div>
	);
}

export { CodeBlock };
