/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode, Fragment } from 'react';

import {
	Badge,
	BadgeVariants,
	cn,
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
import { ExternalLinkIcon, TargetIcon } from '@radix-ui/react-icons';
import { useCopyToClipboard } from '@/shared/hooks';

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
	const [, copy] = useCopyToClipboard();

	if (!requirements) return null;

	return (
		<div>
			<h3 className="text-sm font-semibold mb-2">Requirements</h3>
			<div className="border rounded-md p-2">
				<ul className="list-none space-y-1 text-sm font-mono">
					{requirements.map((requirement, idx) => (
						<li key={idx}>
							<Badge
								className="bg-badge-2"
								onClick={() =>
									copy(requirement).then((success) => {
										if (success) {
											toast.success('Copied to clipboard');
										} else {
											toast.error('Failed to copy to clipboard');
										}
									})
								}
							>
								{requirement}
							</Badge>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
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
						{parameters.map((parameter) => (
							<tr
								key={parameter.name}
								className="border-b transition-colors hover:bg-gray-50 cursor-pointer"
								onClick={() =>
									copy(`${parameter.name}=${parameter.value}`).then(
										(success) => {
											if (success) {
												toast.success('Copied to clipboard');
											} else {
												toast.error('Failed to copy to clipboard');
											}
										}
									)
								}
							>
								<td className="p-4 align-middle py-1">{parameter.name}</td>
								<td className="p-4 align-middle py-1">{parameter.value}</td>
							</tr>
						))}
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
	const [, copy] = useCopyToClipboard();

	if (!artifacts) return null;

	return (
		<div>
			<h3 className="text-sm font-semibold mb-2">Artifacts</h3>
			<div className="border rounded-md p-2">
				<ul className="list-none space-y-1 text-sm font-mono">
					{artifacts.map((artifact, idx) => (
						<li key={idx}>
							<Badge
								className="bg-badge-16"
								onClick={() =>
									copy(artifact.artifact).then((success) => {
										if (success) {
											toast.success('Copied to clipboard');
										} else {
											toast.error('Failed to copy to clipboard');
										}
									})
								}
							>
								{artifact.artifact}
							</Badge>
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
										'border-b transition-colors hover:bg-gray-50 data-[state=selected]:bg-gray-50',
										idx % 2 === 0 ? 'bg-gray-50' : ''
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
									<td className="align-middle py-2 pr-4 pl-0.5 text-sm">
										{verdict.verdict}
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
}

function MetaInfoItem(props: MetaInfoItemProps) {
	const { icon, label, value, href } = props;
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

	return (
		<div
			className={cn(
				'flex items-center gap-1 px-1 rounded',
				!href && 'cursor-pointer hover:bg-gray-50'
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
				<div>
					<span className="text-sm text-gray-800">{value}</span>
				</div>
			)}
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
	const [, copy] = useCopyToClipboard();

	const handleCopy = (text: string) => {
		copy(text).then((success) => {
			if (success) {
				toast.success('Copied to clipboard');
			} else {
				toast.error('Failed to copy to clipboard');
			}
		});
	};

	return (
		<div className="flex items-center px-1">
			<Clock className="size-5" />
			<div
				className="flex items-center hover:bg-gray-50 rounded px-1 cursor-pointer"
				onClick={() => handleCopy(duration)}
			>
				<span className="text-sm text-text-primary font-semibold">
					Duration:&nbsp;
				</span>
				<span className="text-sm text-gray-800">{duration}</span>
			</div>
			<Separator orientation="vertical" className="h-4 mx-2" />
			<div
				className="flex items-center hover:bg-gray-50 rounded px-1 cursor-pointer"
				onClick={() => handleCopy(start)}
			>
				<span className="text-sm text-text-primary font-semibold">
					Start:&nbsp;
				</span>
				<span className="text-sm text-gray-800">{start}</span>
			</div>
			<Separator orientation="vertical" className="h-4 mx-2" />
			<div
				className="flex items-center hover:bg-gray-50 rounded px-1 cursor-pointer"
				onClick={() => handleCopy(end)}
			>
				<span className="text-sm text-text-primary font-semibold">
					End:&nbsp;
				</span>
				<span className="text-sm text-gray-800">{end}</span>
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

	const handleCopy = (text: string) => {
		copy(text).then((success) => {
			if (success) {
				toast.success('Copied to clipboard');
			} else {
				toast.error('Failed to copy to clipboard');
			}
		});
	};

	return (
		<div className="flex items-center px-1 flex-wrap">
			<TwoUsers className="size-5" />
			<span className="text-sm text-text-primary font-semibold px-1">
				Authors:
			</span>
			{authors.map((author, index) => (
				<Fragment key={author.email}>
					<div
						className="flex items-center hover:bg-gray-50 rounded px-1 cursor-pointer"
						onClick={() => handleCopy(author.email)}
					>
						<span className="text-sm text-gray-800">{author.email}</span>
					</div>
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
			<li>
				<MetaInfoItem
					icon={<HashSymbol className="size-5" />}
					label="Hash"
					value={hash}
				/>
			</li>
			<li>
				<MetaDuration start={start} end={end} duration={duration} />
			</li>
			{objective ? (
				<li>
					<MetaInfoItem
						icon={<TargetIcon className="size-5" />}
						label="Objective"
						value={objective}
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
			className="border-b border-gray-300 hover:bg-gray-50 py-1 px-1 cursor-pointer"
			onClick={handleCopy}
		>
			<h2 className="flex items-center gap-2">
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
