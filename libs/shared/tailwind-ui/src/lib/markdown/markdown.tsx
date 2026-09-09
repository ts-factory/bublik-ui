/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Fragment } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '../utils';

export interface MarkdownProps {
	children: string;
	/**
	 * Render without block wrappers, so the content flows inside an existing
	 * line (table cell, list item). Lists still render, but paragraphs do not
	 * introduce vertical margins.
	 */
	inline?: boolean;
	className?: string;
}

const codeComponent: Components['code'] = ({ children }) => (
	<code className="rounded bg-gray-100 px-1 font-mono text-[0.85em]">
		{children}
	</code>
);

const blockComponents: Components = {
	code: codeComponent,
	ul: ({ children }) => (
		<ul className="list-disc pl-4 my-1 space-y-0.5">{children}</ul>
	),
	ol: ({ children }) => (
		<ol className="list-decimal pl-4 my-1 space-y-0.5">{children}</ol>
	),
	a: ({ children, href }) => (
		<a
			href={href}
			target="_blank"
			rel="noreferrer"
			className="text-primary underline"
		>
			{children}
		</a>
	)
};

const inlineComponents: Components = {
	...blockComponents,
	p: ({ children }) => <Fragment>{children}</Fragment>
};

/**
 * Render a markdown string using the same engine (react-markdown + GFM) across
 * the app. Keep the surface small: text emitted by TE tooling only uses inline
 * code, links and simple lists.
 */
export function Markdown(props: MarkdownProps) {
	const { children, inline, className } = props;

	return (
		<div className={cn(inline && 'contents', className)}>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={inline ? inlineComponents : blockComponents}
			>
				{children}
			</ReactMarkdown>
		</div>
	);
}
