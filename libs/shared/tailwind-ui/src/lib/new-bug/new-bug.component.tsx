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

type KeyOption<T> = {
	accessor: keyof T;
	header: string;
	linkAccessor?: keyof T;
	linkTextKey?: keyof T;
	preformat?: boolean;
};

function generateMarkdownTable<T extends Record<string, unknown>>(
	objects: Array<T>,
	keys: readonly KeyOption<T>[]
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

	const escapeMarkdown = (str: string) => {
		return str.replace(/\|/g, '\\|').replace(/\n/g, ' '); // Escape '|' and replace newlines
	};

	const header = `| ${keys
		.map((key, i) => padString(key.header, columnWidths[i]))
		.join(' | ')} |`;

	const separator = `| ${columnWidths
		.map((width) => '-'.repeat(width))
		.join(' | ')} |`;

	const rows = objects.map((obj) => {
		const row = keys.map((key, i) => {
			let value =
				obj[key.accessor] !== undefined ? String(obj[key.accessor]) : '';

			value = escapeMarkdown(value);

			if (key.linkAccessor && key.linkTextKey) {
				const link = obj[key.linkAccessor];
				const linkText = obj[key.linkTextKey];
				if (link && linkText) {
					return padString(`[${linkText}](${link})`, columnWidths[i]);
				}
			}

			// Wrap in backticks if the preformat option is set to true for this key
			if (key.preformat) value = `\`\`\`${value}\`\`\``;

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

	function findAllMatches<T, U>(arr1: T[], arr2: U[]): [T, U][] {
		const matches: [T, U][] = [];

		for (const item1 of arr1) {
			for (const item2 of arr2) {
				matches.push([item1, item2]);
			}
		}

		return matches;
	}
	try {
		let markdown = '';
		// 1. Link and path
		markdown += `Test Name: ${options.name}\n`;

		if (options.objectives?.length) {
			options.objectives.forEach(
				(ob) => (markdown += `Test Objective: ${ob}\n`)
			);
		}

		if (options?.hashes?.length) {
			options.hashes.forEach((ob) => (markdown += `Hash: ${ob}\n`));
		}

		if (options.path) {
			markdown += `Path: \`${options.path}\`\n`;
		}

		if (
			Object.entries(options.tags.specialCategories).some(
				([_, v]) => v.length
			) &&
			options.hashes &&
			options.hashes.length
		) {
			Object.entries(options.tags.specialCategories).forEach(([_, values]) => {
				if (!values.length) return;
				const matches = findAllMatches(values, options.hashes as string[]);
				matches.forEach((match) => {
					markdown += `CMD: \`./run.sh --cfg=${match[0]} --tester-run=${match[1]} -n\`\n`;
				});
			});
		}

		markdown += `\n-----------------------------------\n\n`;
		markdown += `[Go To Full Log](${options.link})\n`;
		if (options.lineLink) {
			markdown += `[Go To Log Line ${
				new URL(options.lineLink).searchParams.get('lineNumber')?.split('_')[1]
			}](${options.lineLink})\n`;
		}

		// 6. Verdicts
		if (options.verdicts?.length) {
			markdown += '\n## Verdicts\n\n';
			markdown += `${generateMarkdownTable(
				options.verdicts.map((v) => ({ value: v })),
				[{ accessor: 'value', header: 'Value' }]
			)}\n\n`;
		}

		// 2. Branches
		if (options.tags.branches.length) {
			markdown += `\n## Branches\n\n`;
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
			markdown += `${generateMarkdownTable(options.tags.parameters, [
				{ accessor: 'name', header: 'Name' },
				{ accessor: 'value', header: 'Value', preformat: true }
			])}\n\n`;
		}
		// 5. Important Tags
		if (options.tags.important.length) {
			markdown += '## Important Tags\n\n';
			markdown += `${generateMarkdownTable(
				parseKeyValuePairs(options.tags.important),
				NAME_VALUE_KEYS
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
	} catch (e) {
		console.error(e);
		return 'Failed to prepare markdown.\n Please report.';
	}
}

type BugTags = {
	branches: string[];
	important: string[];
	revisions?: { name?: string; value: string; url?: string }[];
	parameters?: { name: string; value: string }[];
	specialCategories: Record<string, string[]>;
};

interface NewBugButtonProps {
	link: string;
	path?: string;
	name: string;
	verdicts?: string[];
	hashes?: string[];
	tags: BugTags;
	isDisabled?: boolean;
	objectives?: string[];
	lineLink?: string;
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
					'p-4 bg-white rounded-xl shadow-popover min-w-[40vw] overflow-auto max-w-[80vw]',
					dialogContentStyles()
				)}
			>
				<div className="flex flex-col gap-4">
					<h2 className="text-[0.875rem] leading-[1.125rem] font-semibold">
						New Bug
					</h2>
					<pre
						className={cn(
							'transition-all border border-border-primary rounded-md hover:border-primary whitespace-break-spaces overflow-wrap-anywhere',
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
