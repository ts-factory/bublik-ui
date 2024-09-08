/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode, useEffect, useRef } from 'react';
import { skipToken } from '@reduxjs/toolkit/dist/query';

import { formatTimeToDot } from '@/shared/utils';
import {
	Resizable,
	CardHeader,
	ButtonTw,
	Icon,
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogOverlay,
	dialogContentStyles,
	dialogOverlayStyles,
	resizableStyles,
	toast,
	cn
} from '@/shared/tailwind-ui';
import {
	useGetRunDetailsQuery,
	useGetTreeByRunIdQuery
} from '@/services/bublik-api';

import {
	LogPickerContainer,
	LinkToHistoryContainer,
	LinkToSourceContainer,
	LinkToMeasurementsContainer,
	TreeContainer
} from './containers';
import { LinkToRun } from './components';
import { useIsLogLegacy, useLogPage } from './hooks';
import { useCopyToClipboard } from '@/shared/hooks';

export interface LogFeatureProps {
	runId?: string;
	isTreeShown?: boolean;
	children?: ReactNode;
}

export const LogFeature = (props: LogFeatureProps) => {
	const { runId, children, isTreeShown } = props;
	const { data: details } = useGetRunDetailsQuery(runId ?? skipToken);
	const { data: tree } = useGetTreeByRunIdQuery(runId ?? skipToken);
	const { isLegacyLog, toggleLog } = useIsLogLegacy();
	const { focusId } = useLogPage();
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!details) {
			document.title = 'Log - Bublik';
			return;
		}

		const { main_package: name, start } = details;
		const formattedTime = formatTimeToDot(start);
		const focusedTestName = focusId ? tree?.tree?.[focusId].name : '';

		document.title = `${
			focusedTestName ? `${focusedTestName} - ` : ''
		}${name} | ${formattedTime} | ${runId} | Log - Bublik`;
	}, [details, runId, focusId, tree?.tree]);

	useEffect(() => {
		scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
	}, [focusId]);

	if (!runId) return null;

	return (
		<>
			{isTreeShown && (
				<Resizable
					{...resizableStyles}
					className="flex overflow-visible"
					enable={{ right: true }}
					defaultSize={{ width: 325, height: '100%' }}
					minWidth={300}
					maxWidth={1000}
				>
					<TreeContainer runId={runId} />
				</Resizable>
			)}
			<div className="flex flex-col flex-grow h-full gap-1 overflow-hidden">
				{children}
				<main className="flex-grow bg-white rounded-md overflow-hidden">
					<CardHeader label="Log">
						<div className="flex items-center gap-2">
							<ButtonTw
								variant="secondary"
								state={isLegacyLog && 'active'}
								size="xss"
								onClick={toggleLog}
							>
								Legacy
							</ButtonTw>
							<LinkToRun runId={runId} />
							<LinkToHistoryContainer runId={runId} focusId={focusId} />
							<LinkToMeasurementsContainer focusId={focusId} />
							<LinkToSourceContainer runId={runId} />
							<NewBugButton
								link={window.location.href}
								name=""
								path={[]}
								tags={{
									branches: details?.branches ?? [],
									important: details?.important_tags ?? [],
									revisions: details?.revisions ?? []
								}}
							/>
						</div>
					</CardHeader>
					<div
						className={cn(
							'overflow-auto relative h-full',
							!isLegacyLog ? 'h-[calc(100%-36px)]' : 'h-[calc(100%-20px)]'
						)}
						ref={scrollRef}
					>
						<LogPickerContainer />
					</div>
				</main>
			</div>
		</>
	);
};

function createMarkdownTableFromObj(obj: Record<string, unknown>[]): string {
	return 'TEST TABLE';
}

function getFormattedMarkdown(options: NewBugButtonProps): string {
	const DELIMETER = '=';
	let markdown = '';

	function extractNameValueFromTag(
		tags: string[],
		delimter = DELIMETER
	): Record<string, unknown> {
		return {};
	}

	// 1. Link and path
	markdown += `[${options.name}](${options.link})\n`;
	// 2. Parameters
	markdown += `${createMarkdownTableFromObj(
		options.tags.parameters.map((v) => ({ value: v }))
	)}\n`;
	// 3. Revisions
	markdown += `${createMarkdownTableFromObj(options.tags.revisions)}\n`;
	// 4. Important Tags
	markdown += `${createMarkdownTableFromObj(options.tags.important)}\n`;
	// 5. Configuration
	markdown += Object.entries(options.tags.specialCategories).map(
		([label, tags]) => `\n`
	);

	return markdown;
}

type BugTags = {
	branches: string[];
	important: string[];
	revisions: { name?: string; value: string; url?: string }[];
	parameters: string[];
	/* label - tags */
	specialCategories: Record<string, string[]>;
};

interface NewBugButtonProps {
	link: string;
	path: string[];
	name: string;
	verdicts?: string[];
	tags: BugTags;
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
				<ButtonTw variant="secondary" size="xss">
					<Icon name="IssueIcon" className="size-5 mr-1.5" />
					<span>New Bug</span>
				</ButtonTw>
			</DialogTrigger>
			<DialogOverlay className={dialogOverlayStyles()} />
			<DialogContent
				className={cn(
					'p-4 bg-white rounded-xl shadow-popover',
					dialogContentStyles()
				)}
			>
				<div className="flex flex-col gap-4">
					<h2 className="text-[0.875rem] leading-[1.125rem] font-semibold">
						Bug
					</h2>
					<textarea defaultValue={markdown} />
					<ButtonTw variant="secondary" size="xs" onClick={handleBugCopyClick}>
						Copy
					</ButtonTw>
				</div>
			</DialogContent>
		</Dialog>
	);
}
