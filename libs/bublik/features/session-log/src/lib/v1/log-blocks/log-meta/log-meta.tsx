/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode, Fragment } from 'react';

import {
	Badge,
	BadgeVariants,
	cn,
	CopyTooltip,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
	Icon,
	Separator,
	toast,
	Tooltip
} from '@/shared/tailwind-ui';
import { LogHeaderBlock } from '@/shared/types';
import {
	Clock,
	HashSymbol,
	InformationCircleExclamationMark,
	TriangleExclamationMark,
	TwoUsers
} from '@/icons';
import {
	EnvelopeClosedIcon,
	ExternalLinkIcon,
	TargetIcon
} from '@radix-ui/react-icons';
import { useCopyToClipboard } from '@/shared/hooks';
import {
	calculateAbsoluteTestTimes,
	formatTimestampToFull,
	formatDurationWithMs
} from '@/shared/utils';

import { useLogMetaContext } from '../../log-meta-context';

export const BlockLogMeta = (props: LogHeaderBlock) => {
	const { parameters, artifacts, verdicts, requirements } = props.meta;

	return (
		<div data-block-type={props.type} className="flex flex-col gap-4">
			<div className="flex gap-4">
				<div className="flex flex-col gap-1">
					<MetaHeader header={props} />
					<MetaInformation header={props} />
					<VerdictsTable verdicts={verdicts} />
				</div>
			</div>
			<div className="flex flex-col gap-4">
				<div className="flex gap-4 flex-wrap">
					<ParametersTable parameters={parameters} />
					<ArtifactsTable artifacts={artifacts} />
					<RequirementsTable requirements={requirements} />
				</div>
			</div>
		</div>
	);
};

interface RequirementsTableProps {
	requirements: LogHeaderBlock['meta']['requirements'];
}

function RequirementsTable(props: RequirementsTableProps) {
	const { requirements } = props;

	if (!requirements) return null;

	return (
		<div>
			<h3 className="text-sm font-semibold mb-2">Requirements</h3>
			<div className="border rounded-md p-2">
				<ul className="list-none space-y-1 text-sm font-mono">
					{requirements.map((requirement, idx) => (
						<li key={idx}>
							<CopyTooltip copyString={requirement}>
								<Badge className="bg-badge-2">{requirement}</Badge>
							</CopyTooltip>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}

function isPreformatted(value: string): boolean {
	return isWithBracesWithoutNewlines(value) || value.includes('\n');
}

function isWithBracesWithoutNewlines(value: string): boolean {
	return value.includes('{') && !value.includes('\n');
}

function isCodeBlock(lines: string[]): boolean {
	// Common code block indicators
	const codePatterns = [
		// Comments
		/^#/,
		/^\/\//,
		/^\/\*/,
		// Control structures
		/\bdo\s*\(/,
		/\brepeat\s*\(/,
		/\bawait\s*\(/,
		/\bif\s*\(/,
		/\bwhile\s*\(/,
		/\bfor\s*\(/,
		// Function calls with parameters
		/\w+\s*\([^)]*\)\s*\.?\w*/,
		// Variable assignments
		/\w+:\w+/,
		// Semicolons at end
		/;\s*$/
	];

	// Check if enough lines match code patterns
	const matchingLines = lines.filter((line) =>
		codePatterns.some((pattern) => pattern.test(line.trim()))
	);

	// Consider it code if more than 30% of non-empty lines match patterns
	const nonEmptyLines = lines.filter((line) => line.trim()).length;
	return matchingLines.length / nonEmptyLines > 0.3;
}

function formatParameterValue(value: string): string {
	try {
		if (value.includes('\n')) {
			const lines = value.split('\n');

			if (isCodeBlock(lines)) return value;

			let indentLevel = 0;
			return lines
				.map((line) => {
					const trimmed = line.trim();
					if (!trimmed) return '';

					if (trimmed.startsWith('}') || trimmed.startsWith('],')) {
						indentLevel--;
					}

					const indent = '  '.repeat(Math.max(0, indentLevel));

					if (
						trimmed.endsWith('{') ||
						trimmed.endsWith('[') ||
						trimmed.endsWith(':{')
					) {
						indentLevel++;
					}

					return indent + trimmed;
				})
				.filter(Boolean)
				.join('\n');
		}

		if (isWithBracesWithoutNewlines(value)) {
			let indentLevel = 0;
			const indent = '  ';
			let result = '';
			let inString = false;

			for (let i = 0; i < value.length; i++) {
				const char = value[i];

				if (char === '"' || char === "'") {
					inString = !inString;
				}

				if (!inString) {
					if (char === '{' || char === '[') {
						result += char + '\n' + indent.repeat(++indentLevel);
						continue;
					}
					if (char === '}' || char === ']') {
						result += '\n' + indent.repeat(--indentLevel) + char;
						continue;
					}
					if (char === ',') {
						result += char + '\n' + indent.repeat(indentLevel);
						continue;
					}
				}

				result += char;
			}

			return result;
		}

		return value;
	} catch (error) {
		return value;
	}
}

// Parameters table
interface ParametersTableProps {
	parameters: LogHeaderBlock['meta']['parameters'];
}

function ParametersTable(props: ParametersTableProps) {
	const { parameters } = props;
	const [, copy] = useCopyToClipboard();

	if (!parameters) return null;

	return (
		<div>
			<h3 className="text-sm font-semibold mb-2">Parameters</h3>
			<div className="relative w-full overflow-auto rounded-md border">
				<table className="w-full caption-bottom text-sm">
					<thead className="[&_tr]:border-b">
						<tr className="border-b transition-colors bg-gray-50">
							<th className="h-12 px-4 text-left align-middle font-semibold text-xs">
								Name
							</th>
							<th className="h-12 px-4 text-left align-middle font-semibold text-xs">
								Value
							</th>
						</tr>
					</thead>
					<tbody className="[&_tr:last-child]:border-0 text-sm font-mono">
						{parameters.map((parameter) => {
							const isFormatted = isPreformatted(parameter.value);

							function handleCopy() {
								copy(
									isFormatted
										? formatParameterValue(parameter.value)
										: `${parameter.name}=${parameter.value}`
								).then((success) => {
									if (success) {
										toast.success('Copied to clipboard');
									} else {
										toast.error('Failed to copy to clipboard');
									}
								});
							}

							return (
								<tr
									key={parameter.name}
									className={cn(
										'border-b transition-colors group',
										!isFormatted && 'hover:bg-gray-50 cursor-pointer'
									)}
									onClick={isFormatted ? undefined : handleCopy}
								>
									<td className="p-4 align-middle py-1">{parameter.name}</td>
									<td className="pl-4 pr-1.5 align-middle py-1 relative">
										<div className="group flex items-center gap-1 justify-between">
											<pre
												className={cn(
													'text-sm font-mono relative group',
													isFormatted && 'bg-badge-1 p-2 rounded-md'
												)}
											>
												{isFormatted ? (
													<button
														onClick={handleCopy}
														className="absolute top-4 -translate-y-1/2 right-2 hover:bg-primary-wash rounded-md"
													>
														<Icon
															name="PaperStack"
															size={20}
															className="opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0 "
														/>
													</button>
												) : null}
												{isFormatted
													? formatParameterValue(parameter.value)
													: parameter.value}
											</pre>
											{!isFormatted && (
												<Icon
													name="PaperStack"
													size={20}
													className="opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0"
												/>
											)}
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}

// Artifacts table
interface ArtifactsTableProps {
	artifacts: LogHeaderBlock['meta']['artifacts'];
}

function ArtifactsTable(props: ArtifactsTableProps) {
	const { artifacts } = props;

	if (!artifacts) return null;

	return (
		<div>
			<h3 className="text-sm font-semibold mb-2">Artifacts</h3>
			<div className="border rounded-md p-2">
				<ul className="list-none space-y-1 text-sm font-mono">
					{artifacts.map((artifact, idx) => (
						<li key={idx}>
							<CopyTooltip copyString={artifact.artifact}>
								<Badge className="bg-badge-16">{artifact.artifact}</Badge>
							</CopyTooltip>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}

// Verdicts table
interface VerdictsTableProps {
	verdicts: LogHeaderBlock['meta']['verdicts'];
}

function VerdictsTable(props: VerdictsTableProps) {
	const { verdicts } = props;
	const [, copy] = useCopyToClipboard();

	if (!verdicts) return null;

	function getVerdictIcon(level: string) {
		const baseClasses = 'size-5';

		switch (level) {
			case 'INFO':
				return (
					<Icon
						name="InformationCircleExclamationMark"
						className={`${baseClasses} text-gray-500`}
					/>
				);
			case 'ERROR':
				return (
					<Icon
						name="InformationCircleCrossMark"
						className={`${baseClasses} text-text-unexpected`}
					/>
				);
			case 'WARN':
				return (
					<Icon
						name="InformationCircleQuestionMark"
						className={`${baseClasses} text-yellow-500`}
					/>
				);
			case 'VERB':
				return (
					<Icon
						name="InformationCircleExclamationMark"
						className={`${baseClasses} text-green-500`}
					/>
				);
			case 'PACKET':
				return (
					<Icon
						name="InformationCircleExclamationMark"
						className={`${baseClasses} text-purple-500`}
					/>
				);
			default:
				return (
					<Icon
						name="InformationCircleExclamationMark"
						className={`${baseClasses} text-gray-500`}
					/>
				);
		}
	}

	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-sm font-semibold">Verdicts</h3>
			<div className="border rounded-md overflow-hidden">
				<div className="relative w-full overflow-auto">
					<table className="w-full caption-bottom text-sm">
						<tbody className="[&_tr:last-child]:border-0">
							{verdicts.map((verdict, idx) => (
								<tr
									key={idx}
									className={cn(
										'border-b transition-colors cursor-pointer hover:bg-gray-50'
									)}
									onClick={() =>
										copy(verdict.verdict).then((success) => {
											if (success) {
												toast.success('Copied to clipboard');
											} else {
												toast.error('Failed to copy to clipboard');
											}
										})
									}
								>
									<Tooltip content={`Level: ${verdict.level}`}>
										<td className="align-middle p-2 w-px">
											{getVerdictIcon(verdict.level)}
										</td>
									</Tooltip>
									<td className="align-middle py-1.5 pr-4 pl-0.5 text-sm group">
										<div className="relative flex items-center gap-1 justify-between">
											<span>{verdict.verdict}</span>
											<Icon
												name="PaperStack"
												size={20}
												className="opacity-0 group-hover:opacity-100 transition-opacity text-primary"
											/>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}

interface MetaInfoItemProps {
	icon?: ReactNode;
	label: string;
	value: string | number;
	href?: string;
	className?: string;
	withBorder?: boolean;
}

function MetaInfoItem(props: MetaInfoItemProps) {
	const { icon, label, value, href, className, withBorder } = props;
	const [, copy] = useCopyToClipboard();

	const handleCopy = (text: string) => {
		if (href) return;
		copy(text).then((success) => {
			if (success) {
				toast.success('Copied to clipboard');
			} else {
				toast.error('Failed to copy to clipboard');
			}
		});
	};

	const isLong = value.toString().length >= 81;

	return (
		<div
			className={cn(
				'flex items-center gap-1 px-1 group w-fit relative',
				!href && 'cursor-pointer hover:bg-gray-50',
				withBorder && isLong && 'border-t border-b border-border-primary'
			)}
			onClick={() => handleCopy(value.toString())}
		>
			{icon}
			<span className="text-sm text-text-primary font-semibold">{label}:</span>
			{href ? (
				<a
					href={href}
					className="text-sm flex items-center gap-1 hover:underline"
				>
					{value}
					<ExternalLinkIcon className="size-4" />
				</a>
			) : (
				<div
					className={cn(
						'flex items-center gap-1',
						withBorder && isLong && 'border-l border-border-primary px-2'
					)}
				>
					<pre
						className={cn(
							'text-sm text-gray-800 whitespace-pre-wrap',
							className
						)}
					>
						{value}
					</pre>
					<Icon
						name="PaperStack"
						size={16}
						className="opacity-0 group-hover:opacity-100 transition-opacity text-primary"
					/>
				</div>
			)}
		</div>
	);
}

interface CopyIconProps {
	size?: number;
}

function CopyIcon(props: CopyIconProps) {
	const { size = 16 } = props;

	return (
		<div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
			<div className="w-6 h-6 bg-gradient-to-r from-transparent to-white" />
			<div className="w-6 h-6 bg-white grid place-items-center">
				<Icon
					name="PaperStack"
					size={size}
					className="opacity-0 group-hover:opacity-100 transition-opacity text-primary"
				/>
			</div>
		</div>
	);
}

interface MetaDurationProps {
	start: string;
	end: string;
	duration: string;
}

function MetaDuration(props: MetaDurationProps) {
	const { start, end, duration } = props;
	const { runDetails } = useLogMetaContext();
	const [, copy] = useCopyToClipboard();

	const hasRequiredData = runDetails?.start && start;

	const handleCopy = (text: string) => {
		copy(text).then((success) => {
			if (success) {
				toast.success('Copied to clipboard');
			} else {
				toast.error('Failed to copy to clipboard');
			}
		});
	};

	let displayStart = start;
	let displayEnd = end;
	let displayDuration = duration;
	let showWarning = false;

	if (hasRequiredData) {
		try {
			const runStart = runDetails?.start;
			if (runStart) {
				const absoluteTimes = calculateAbsoluteTestTimes(runStart, start, end);
				displayStart = formatTimestampToFull(absoluteTimes.start);
				displayEnd =
					end && absoluteTimes.end
						? formatTimestampToFull(absoluteTimes.end)
						: 'In progress';
			}
		} catch (error) {
			showWarning = true;
		}
	} else if (start) {
		showWarning = true;
	}

	if (duration) {
		try {
			displayDuration = formatDurationWithMs(duration);
		} catch (error) {
			displayDuration = duration;
			showWarning = true;
		}
	}

	return (
		<div className="flex items-center px-1">
			<Clock className="size-5" />
			<div
				className="flex items-center hover:bg-gray-50 rounded px-1 cursor-pointer relative group"
				onClick={() => handleCopy(displayDuration)}
			>
				<span className="text-sm text-text-primary font-semibold">
					Duration:&nbsp;
				</span>
				<span className="text-sm text-gray-800">
					{displayDuration}
					{showWarning && (
						<Tooltip content="Some values may be unformatted">
							<TriangleExclamationMark className="inline size-4 ml-1 text-yellow-600" />
						</Tooltip>
					)}
					<CopyIcon />
				</span>
			</div>
			<Separator orientation="vertical" className="h-4 mx-2" />
			<div
				className="flex items-center hover:bg-gray-50 rounded px-1 cursor-pointer relative group"
				onClick={() => handleCopy(displayStart)}
			>
				<span className="text-sm text-text-primary font-semibold">
					Start:&nbsp;
				</span>
				<span className="text-sm text-gray-800">
					{displayStart}
					{showWarning && (
						<Tooltip content="Some values may be unformatted">
							<TriangleExclamationMark className="inline size-4 ml-1 text-yellow-600" />
						</Tooltip>
					)}
					<CopyIcon />
				</span>
			</div>
			<Separator orientation="vertical" className="h-4 mx-2" />
			<div
				className="flex items-center hover:bg-gray-50 rounded px-1 cursor-pointer relative group"
				onClick={() => handleCopy(displayEnd)}
			>
				<span className="text-sm text-text-primary font-semibold">
					End:&nbsp;
				</span>
				<span className="text-sm text-gray-800">
					{displayEnd}
					{showWarning && (
						<Tooltip content="Some values may be unformatted">
							<TriangleExclamationMark className="inline size-4 ml-1 text-yellow-600" />
						</Tooltip>
					)}
					<CopyIcon />
				</span>
			</div>
		</div>
	);
}

interface MetaAuthorsProps {
	authors: LogHeaderBlock['meta']['authors'];
}

function MetaAuthors({ authors }: MetaAuthorsProps) {
	const [, copy] = useCopyToClipboard();

	if (!authors?.length) return null;

	const handleCopy = (email: string) => {
		copy(email).then((success) => {
			if (success) {
				toast.success('Copied to clipboard');
			} else {
				toast.error('Failed to copy to clipboard');
			}
		});
	};

	const handleMailTo = (email: string) => {
		window.location.href = `mailto:${email}`;
	};

	return (
		<div className="flex items-center px-1 flex-wrap">
			<TwoUsers className="size-5" />
			<span className="text-sm text-text-primary font-semibold px-1">
				Authors:
			</span>
			{authors.map((author, index) => (
				<Fragment key={author.email}>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<div className="flex items-center hover:bg-gray-50 rounded px-1 cursor-pointer">
								<span className="text-sm text-gray-800">{author.email}</span>
							</div>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="bg-white rounded-md shadow-popover flex flex-col min-w-[160px]">
							<DropdownMenuLabel className="text-xs">Author</DropdownMenuLabel>
							<Separator className="h-px my-1" />
							<DropdownMenuGroup className="flex flex-col gap-1">
								<DropdownMenuItem
									onClick={() => handleCopy(author.email)}
									className="pl-2"
								>
									<Icon
										name="PaperStack"
										size={16}
										className="shrink-0 scale-125 mr-1.5"
									/>
									Copy email
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => handleMailTo(author.email)}
									className="pl-2"
								>
									<EnvelopeClosedIcon className="size-4 mr-1.5" />
									Send email
								</DropdownMenuItem>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
					{index < authors.length - 1 && (
						<Separator orientation="vertical" className="h-4 mx-1" />
					)}
				</Fragment>
			))}
		</div>
	);
}

interface MetaInformationProps {
	header: LogHeaderBlock;
}

function MetaInformation(props: MetaInformationProps) {
	const { header } = props;

	const hash = header.entity_model.extended_properties?.hash;
	const start = header.meta.start;
	const end = header.meta.end;
	const duration = header.meta.duration;
	const objective = header.meta.objective;
	const description = header.meta.description;
	const authors = header.meta.authors;

	return (
		<ul className="flex flex-col gap-1 py-1">
			{hash ? (
				<li>
					<MetaInfoItem
						icon={<HashSymbol className="size-5" />}
						label="Hash"
						value={hash}
					/>
				</li>
			) : null}
			<li>
				<MetaDuration start={start} end={end} duration={duration} />
			</li>
			{objective ? (
				<li>
					<MetaInfoItem
						icon={<TargetIcon className="size-5" />}
						label="Objective"
						value={objective}
						className="max-w-2xl"
						withBorder
					/>
				</li>
			) : null}
			{description ? (
				<li>
					<MetaInfoItem
						icon={<InformationCircleExclamationMark className="size-5" />}
						label="Description"
						value={description.text}
						href={description.url}
					/>
				</li>
			) : null}
			{authors?.length ? (
				<li>
					<MetaAuthors authors={authors} />
				</li>
			) : null}
		</ul>
	);
}

function formatTestHeader(header: LogHeaderBlock): string {
	const { entity, id, name } = header.entity_model;

	const finalId =
		Object.entries(header.entity_model.extended_properties)
			.find(([key]) => key === 'tin')?.[1]
			?.toString() ?? id;

	const formattedHeader = `${entity} ${finalId}: ${name}`;

	return formattedHeader;
}

interface MetaHeaderProps {
	header: LogHeaderBlock;
}

function MetaHeader(props: MetaHeaderProps) {
	const { header } = props;
	const [, copy] = useCopyToClipboard();

	function handleCopy() {
		copy(header.entity_model.name).then((success) => {
			if (success) {
				toast.success('Copied to clipboard');
			} else {
				toast.error('Failed to copy to clipboard');
			}
		});
	}

	return (
		<div
			className="border-b group border-gray-300 hover:bg-gray-50 py-1 px-1 cursor-pointer"
			onClick={handleCopy}
		>
			<h2 className="flex items-center gap-2 group">
				<span className="text-xl font-semibold">
					{formatTestHeader(header)}
				</span>
				<Badge
					variant={
						header.entity_model.error
							? BadgeVariants.Unexpected
							: BadgeVariants.Expected
					}
				>
					{header.entity_model.result}
				</Badge>
				<Icon
					name="PaperStack"
					size={20}
					className="opacity-0 group-hover:opacity-100 transition-opacity text-primary"
				/>
			</h2>
			{header.entity_model.error ? (
				<span className="text-sm flex items-center gap-1 text-yellow-600">
					<TriangleExclamationMark className="size-5" />
					{header.entity_model.error}
				</span>
			) : null}
		</div>
	);
}
