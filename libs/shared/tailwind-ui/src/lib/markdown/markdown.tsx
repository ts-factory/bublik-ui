/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Fragment, ReactNode } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '../utils';
import { remarkLineBreaks } from './remark-line-breaks';

export interface MarkdownProps {
	children: string;
	/**
	 * Render without block wrappers, so the content flows inside an existing
	 * line (table cell, list item). Lists still render; paragraphs, headings,
	 * code blocks and quotes give up their wrappers.
	 */
	inline?: boolean;
	/**
	 * Render newlines as line breaks and keep extra blank lines, as a GitHub
	 * comment does, instead of folding them away. For text people type.
	 */
	breaks?: boolean;
	className?: string;
}

const codeComponent: Components['code'] = ({ children }) => (
	<code className="rounded bg-gray-100 px-1 font-mono text-[0.85em]">
		{children}
	</code>
);

// Preflight strips headings to body text, so they need their weight back to
// read as headings at all. Sizes stay close to the body: this is text inside
// a panel, not a page.
const headingClassName = 'font-semibold mt-3 mb-1 first:mt-0';

const blockComponents: Components = {
	code: codeComponent,
	h1: ({ children }) => (
		<h1 className={cn(headingClassName, 'text-[1.25em]')}>{children}</h1>
	),
	h2: ({ children }) => (
		<h2 className={cn(headingClassName, 'text-[1.125em]')}>{children}</h2>
	),
	h3: ({ children }) => <h3 className={headingClassName}>{children}</h3>,
	h4: ({ children }) => <h4 className={headingClassName}>{children}</h4>,
	h5: ({ children }) => <h5 className={headingClassName}>{children}</h5>,
	h6: ({ children }) => <h6 className={headingClassName}>{children}</h6>,
	// A code block wraps `code`, which already carries the inline-code chip;
	// the block takes the background and the chip inside it is reset.
	pre: ({ children }) => (
		<pre className="my-1.5 overflow-x-auto rounded bg-gray-100 p-2 font-mono text-[0.85em] [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-[1em]">
			{children}
		</pre>
	),
	blockquote: ({ children }) => (
		<blockquote className="my-1.5 border-l-2 border-border-primary pl-2 text-text-menu">
			{children}
		</blockquote>
	),
	hr: () => <hr className="my-2 border-border-primary" />,
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

const unwrap = ({ children }: { children?: ReactNode }) => (
	<Fragment>{children}</Fragment>
);

// Every block that would start a new line gives up its wrapper, so the text
// keeps flowing in the line it sits in. A code block in particular would
// otherwise bring its `white-space: pre` and break the line at each newline.
const inlineComponents: Components = {
	...blockComponents,
	p: unwrap,
	h1: unwrap,
	h2: unwrap,
	h3: unwrap,
	h4: unwrap,
	h5: unwrap,
	h6: unwrap,
	pre: unwrap,
	blockquote: unwrap,
	hr: () => null
};

/**
 * Render a markdown string using the same engine (react-markdown + GFM) across
 * the app. Text emitted by TE tooling only uses inline code, links and simple
 * lists; issue descriptions also bring headings and code blocks.
 */
export function Markdown(props: MarkdownProps) {
	const { children, inline, breaks, className } = props;

	return (
		<div className={cn(inline && 'contents', className)}>
			<ReactMarkdown
				remarkPlugins={breaks ? [remarkGfm, remarkLineBreaks] : [remarkGfm]}
				components={inline ? inlineComponents : blockComponents}
			>
				{children}
			</ReactMarkdown>
		</div>
	);
}
