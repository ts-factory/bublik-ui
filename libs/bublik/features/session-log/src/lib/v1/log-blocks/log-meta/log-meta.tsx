/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode } from 'react';

import {
	Badge,
	BadgeVariants,
	cn,
	Icon,
	Separator,
	Tooltip
} from '@/shared/tailwind-ui';
import { checkSchema } from '@/shared/utils';

import {
	LogHeaderArtifactSchema,
	LogHeaderAuthorsSchema,
	LogHeaderBlock,
	LogHeaderVerdictSchema
} from '@/shared/types';
import {
	Clock,
	HashSymbol,
	InformationCircleExclamationMark,
	TriangleExclamationMark,
	TwoUsers
} from '@/icons';
import { ExternalLinkIcon, TargetIcon } from '@radix-ui/react-icons';

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
							<Badge className="bg-badge-2">{requirement}</Badge>
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
								className="border-b transition-colors hover:bg-gray-50"
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

	if (!artifacts) return null;

	return (
		<div>
			<h3 className="text-sm font-semibold mb-2">Artifacts</h3>
			<div className="border rounded-md p-2">
				<ul className="list-none space-y-1 text-sm font-mono">
					{artifacts.map((artifact, idx) => (
						<li key={idx}>
							<Badge className="bg-badge-16">{artifact.artifact}</Badge>
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
										'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
										idx % 2 === 0 ? 'bg-muted/50' : ''
									)}
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

	return (
		<div className="flex items-center gap-1">
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
				<span className="text-sm text-gray-800">{value}</span>
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

	return (
		<div className="flex items-center">
			<Clock className="size-5 mr-1" />
			<span className="text-sm text-text-primary font-semibold">
				Duration:&nbsp;
			</span>
			<span className="text-sm text-gray-800">{duration}</span>
			<Separator orientation="vertical" className="h-4 mx-2" />
			<span className="text-sm text-text-primary font-semibold">
				Start:&nbsp;
			</span>
			<span className="text-sm text-gray-800">{start}</span>
			<Separator orientation="vertical" className="h-4 mx-2" />
			<span className="text-sm text-text-primary font-semibold">
				End:&nbsp;
			</span>
			<span className="text-sm text-gray-800">{end}</span>
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
					<MetaInfoItem
						icon={<TwoUsers className="size-5" />}
						label="Authors"
						value={authors?.map((author) => author.email).join(', ') ?? ''}
					/>
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

	return (
		<div className="border-b border-gray-300 py-1">
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
				<span className="text-sm text-text-menu flex items-center gap-1 text-yellow-600">
					<TriangleExclamationMark className="size-5" />
					{header.entity_model.error}
				</span>
			) : null}
		</div>
	);
}
