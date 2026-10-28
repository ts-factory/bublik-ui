/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { useEffect, useState } from 'react';
import { useShikiHighlighter } from 'react-shiki';

import { useCopyToClipboard, useTheme } from '@/shared/hooks';

import { ButtonTw } from '../button';
import { Icon } from '../icon';
import { cn, toast } from '../utils';

/** How long a Copy button reads "Copied" after a successful copy. */
const COPIED_RESET_MS = 2000;

interface CopyButtonProps {
	value: string;
	/** The accessible name, e.g. "Copy token" */
	label: string;
}

/** Copies `value`, and says so on the button itself as well as in a toast. */
function CopyButton({ value, label }: CopyButtonProps) {
	const [copied, setCopied] = useState(false);
	const [, copy] = useCopyToClipboard();

	useEffect(() => {
		if (!copied) return;

		const timeout = setTimeout(() => setCopied(false), COPIED_RESET_MS);

		return () => clearTimeout(timeout);
	}, [copied]);

	const handleCopy = () => {
		copy(value).then((success) => {
			setCopied(success);
			if (success) toast.success('Copied to clipboard');
			else toast.error('Failed to copy');
		});
	};

	return (
		<ButtonTw
			type="button"
			variant="outline"
			size="xss"
			aria-label={label}
			onClick={handleCopy}
			// Neutral ink on the card: the blue-on-blue secondary fill read
			// poorly on the header strip, in the dark theme most of all.
			className="shrink-0 bg-bg-primary hover:bg-primary-wash hover:text-primary"
		>
			<Icon
				name={copied ? 'BoxCheckmark' : 'PaperStack'}
				size={16}
				className="mr-1"
			/>
			{copied ? 'Copied' : 'Copy'}
		</ButtonTw>
	);
}

interface CodeBlockProps {
	code: string;
	language: 'bash' | 'json';
	/** The header's label, e.g. the language or what the code is */
	title: string;
	/** Shows a Copy button with this accessible name */
	copyLabel?: string;
	/** Wraps long lines instead of scrolling them */
	wrap?: boolean;
	'data-testid'?: string;
}

/** Highlighted code with a header; plain text until the highlighter loads */
function CodeBlock({
	code,
	language,
	title,
	copyLabel,
	wrap,
	...props
}: CodeBlockProps) {
	const { resolvedTheme } = useTheme();
	const highlighted = useShikiHighlighter(
		code,
		language,
		resolvedTheme === 'dark' ? 'github-dark' : 'github-light'
	);

	return (
		<div className="overflow-hidden border rounded border-border-primary bg-bg-primary">
			<div className="flex items-center justify-between h-9 pl-3 pr-1.5 border-b border-border-primary bg-bg-body text-xs text-text-menu">
				<span className="font-mono">{title}</span>
				{copyLabel ? <CopyButton value={code} label={copyLabel} /> : null}
			</div>
			<div
				data-testid={props['data-testid']}
				className={cn(
					'text-xs leading-5 [&_pre]:m-0 [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:!bg-transparent',
					wrap && '[&_pre]:whitespace-pre-wrap [&_pre]:break-all'
				)}
			>
				{highlighted ?? <pre className="text-text-primary">{code}</pre>}
			</div>
		</div>
	);
}

export { CodeBlock, CopyButton };
export type { CodeBlockProps, CopyButtonProps };
