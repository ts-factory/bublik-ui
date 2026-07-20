/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { CodeBlock } from './elements/code-block';

/**
 * Renders assistant message text as markdown. There is no `@tailwindcss/typography`
 * plugin in this repo, so each element is styled explicitly via the `components`
 * map rather than relying on `prose` classes. Fenced code blocks reuse the same
 * `react-shiki` highlighter the config editor uses.
 */
const components: Components = {
	p: ({ children }) => (
		<p className="my-1.5 first:mt-0 last:mb-0">{children}</p>
	),
	a: ({ children, href }) => (
		<a
			href={href}
			target="_blank"
			rel="noreferrer"
			className="text-primary underline underline-offset-2 hover:opacity-80"
		>
			{children}
		</a>
	),
	ul: ({ children }) => (
		<ul className="my-1.5 list-disc pl-5 space-y-0.5">{children}</ul>
	),
	ol: ({ children }) => (
		<ol className="my-1.5 list-decimal pl-5 space-y-0.5">{children}</ol>
	),
	li: ({ children }) => (
		<li className="marker:text-text-secondary">{children}</li>
	),
	h1: ({ children }) => (
		<h1 className="mt-3 mb-1.5 text-[1rem] font-semibold first:mt-0">
			{children}
		</h1>
	),
	h2: ({ children }) => (
		<h2 className="mt-3 mb-1.5 text-[0.9375rem] font-semibold first:mt-0">
			{children}
		</h2>
	),
	h3: ({ children }) => (
		<h3 className="mt-2.5 mb-1 text-[0.875rem] font-semibold first:mt-0">
			{children}
		</h3>
	),
	blockquote: ({ children }) => (
		<blockquote className="my-1.5 border-l-2 border-border-primary pl-3 text-text-secondary">
			{children}
		</blockquote>
	),
	hr: () => <hr className="my-3 border-border-primary" />,
	table: ({ children }) => (
		<div className="my-1.5 overflow-x-auto">
			<table className="w-full border-collapse text-[0.8125rem]">
				{children}
			</table>
		</div>
	),
	th: ({ children }) => (
		<th className="border border-border-primary px-2 py-1 text-left font-semibold">
			{children}
		</th>
	),
	td: ({ children }) => (
		<td className="border border-border-primary px-2 py-1">{children}</td>
	),
	// `react-shiki` renders its own `<pre>`, so collapse markdown's wrapping
	// `<pre>` to avoid nesting block elements.
	pre: ({ children }) => children,
	code: ({ className, children }) => {
		const match = /language-(\w+)/.exec(className ?? '');
		const content = String(children);
		if (match) {
			return (
				<CodeBlock
					code={content.replace(/\n$/, '')}
					language={match[1]}
				/>
			);
		}
		// Unlabeled fenced code blocks arrive with newlines; inline code is
		// a single line. Preserve block formatting for the former so line
		// breaks and indentation are not collapsed.
		if (content.includes('\n')) {
			return (
				<pre className="my-1.5 overflow-x-auto rounded-md bg-white/60 p-3 font-mono text-[0.8125rem]">
					<code>{content.replace(/\n$/, '')}</code>
				</pre>
			);
		}
		return (
			<code className="rounded bg-white/60 px-1 py-0.5 font-mono text-[0.8125rem]">
				{children}
			</code>
		);
	}
};

export function Markdown({ children }: { children: string }) {
	return (
		<div className="break-words">
			<ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
				{children}
			</ReactMarkdown>
		</div>
	);
}
