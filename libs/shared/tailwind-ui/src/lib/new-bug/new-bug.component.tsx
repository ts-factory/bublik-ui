/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useCopyToClipboard } from '@/shared/hooks';

import { cn, toast } from '../utils';
import {
	Dialog,
	DialogContent,
	DialogOverlay,
	DialogTrigger,
	dialogContentStyles,
	dialogOverlayStyles
} from '../dialog';
import { ButtonTw } from '../button';
import { Icon } from '../icon';

function generateMarkdownTable<T extends Record<string, unknown>>(
	objects: Array<T>,
	keys: readonly {
		accessor: keyof T;
		header: string;
		linkAccessor?: keyof T;
		linkTextKey?: keyof T;
	}[]
): string {
	const columnWidths = keys.map((key) => {
		return Math.max(
			String(key.header).length,
			...objects.map((obj) => {
				const value = obj[key.accessor];
				const link = key.linkAccessor ? obj[key.linkAccessor] : undefined;
				return link && key.linkTextKey && obj[key.linkTextKey]
					? String(obj[key.linkTextKey]).length
					: value !== undefined
					? String(value).length
					: 0;
			})
		);
	});

	const padString = (str: string, length: number) => {
		return str.padEnd(length, ' ');
	};

	const header = `| ${keys
		.map((key, i) => padString(key.header, columnWidths[i]))
		.join(' | ')} |`;

	const separator = `| ${columnWidths
		.map((width) => '-'.repeat(width))
		.join(' | ')} |`;

	const rows = objects.map((obj) => {
		const row = keys.map((key, i) => {
			const value =
				obj[key.accessor] !== undefined ? String(obj[key.accessor]) : '';

			if (key.linkAccessor && key.linkTextKey) {
				const link = obj[key.linkAccessor];
				const linkText = obj[key.linkTextKey];
				if (link && linkText) {
					return padString(`[${linkText}](${link})`, columnWidths[i]);
				}
			}

			return padString(value, columnWidths[i]);
		});
		return `| ${row.join(' | ')} |`;
	});

	return [header, separator, ...rows].join('\n');
}

function getFormattedMarkdown(options: NewBugButtonProps): string {
	const DELIMETER = '=';
	const NAME_VALUE_KEYS = [
		{ accessor: 'name', header: 'Name' },
		{ accessor: 'value', header: 'Value' }
	] as const;

	function parseKeyValuePairs(
		inputArray: string[],
		delimeter = DELIMETER
	): Array<{ name: string; value: string }> {
		return inputArray.map((item) => {
			const [name, value] = item.split(delimeter, 2);
			return { name, value };
		});
	}

	let markdown = '';
	// 1. Link and path
	markdown += `Name: [${options.name}](${options.link})\n`;
	if (options.path) {
		markdown += `Path: ${options.path}\n\n`;
	}
	// 2. Branches
	if (options.tags.branches.length) {
		markdown += `## Branches\n\n`;
		markdown += `${generateMarkdownTable(
			parseKeyValuePairs(options.tags.branches),
			NAME_VALUE_KEYS
		)}\n\n`;
	}
	// 3. Revisions
	if (options.tags?.revisions?.length) {
		markdown += '## Revisions\n\n';
		markdown += `${generateMarkdownTable(options.tags.revisions, [
			{ accessor: 'name', header: 'Name' },
			{
				accessor: 'value',
				header: 'Value',
				linkAccessor: 'url',
				linkTextKey: 'value'
			}
		])}\n\n`;
	}
	// 4. Parameters
	if (options.tags?.parameters?.length) {
		markdown += '## Parameters\n\n';
		markdown += `${generateMarkdownTable(
			parseKeyValuePairs(options.tags.parameters),
			NAME_VALUE_KEYS
		)}\n\n`;
	}
	// 5. Important Tags
	if (options.tags.important.length) {
		markdown += '## Important Tags\n\n';
		markdown += `${generateMarkdownTable(
			parseKeyValuePairs(options.tags.important),
			NAME_VALUE_KEYS
		)}\n\n`;
	}
	// 6. Verdicts
	if (options.verdicts?.length) {
		markdown += '## Verdicts\n\n';
		markdown += `${generateMarkdownTable(
			options.verdicts.map((v) => ({ value: v })),
			[{ accessor: 'value', header: 'Value' }]
		)}\n\n`;
	}
	// 7. Configuration
	if (
		Object.entries(options.tags.specialCategories).some(([_, v]) => v.length)
	) {
		Object.entries(options.tags.specialCategories).forEach(
			([label, values]) => {
				if (!values.length) return;
				markdown += `## ${label}\n\n`;
				markdown += values.join(', ');
			}
		);
	}
	return markdown;
}

type BugTags = {
	branches: string[];
	important: string[];
	revisions?: { name?: string; value: string; url?: string }[];
	parameters?: string[];
	specialCategories: Record<string, string[]>;
};

interface NewBugButtonProps {
	link: string;
	path?: string;
	name: string;
	verdicts?: string[];
	tags: BugTags;
	isDisabled?: boolean;
}

function NewBugButton(props: NewBugButtonProps) {
	const [, copy] = useCopyToClipboard();

	const markdown = getFormattedMarkdown(props);

	const handleBugCopyClick = async () => {
		await copy(markdown)
			.then(() => toast.success('Succesfully copied!'))
			.catch(() => toast.error('Failed to copy!'));
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<ButtonTw variant="secondary" size="xss" disabled={props.isDisabled}>
					<Icon name="IssueIcon" className="size-5 mr-1.5" />
					<span>New Bug</span>
				</ButtonTw>
			</DialogTrigger>
			<DialogOverlay className={dialogOverlayStyles()} />
			<DialogContent
				className={cn(
					'p-4 bg-white rounded-xl shadow-popover min-w-[40vw] overflow-auto',
					dialogContentStyles()
				)}
			>
				<div className="flex flex-col gap-4">
					<h2 className="text-[0.875rem] leading-[1.125rem] font-semibold">
						New Bug
					</h2>
					<pre
						className={cn(
							'transition-all border border-border-primary rounded-md hover:border-primary',
							'text-xs p-2'
						)}
					>
						{markdown}
					</pre>
					<ButtonTw variant="primary" size="xs" onClick={handleBugCopyClick}>
						Copy Markdown
					</ButtonTw>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export { NewBugButton };
