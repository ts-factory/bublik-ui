/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
/* eslint-disable @nx/enforce-module-boundaries */
import { forwardRef, useMemo } from 'react';

import { getErrorMessage, useGetDeployInfoQuery } from '@/services/bublik-api';
import { cva, Tooltip } from '@/shared/tailwind-ui';
import { formatTimeToDot } from '@/shared/utils';

import deployInfo from '../git-info.json';

export const wrapperStyles = cva({
	base: 'flex flex-col gap-2 py-3 px-3.5 rounded-lg text-white min-w-[375px] min-h-[76px] h-full',
	variants: {
		isLoading: { true: 'animate-pulse' },
		isError: { true: 'bg-bg-fillError' }
	},
	compoundVariants: [
		{ isError: false, isLoading: false, class: 'bg-[#FFDD86]' },
		{ isError: false, isLoading: true, class: 'bg-[#FFDD86]' }
	]
});

const textStyles = cva({
	base: 'text-[0.75rem] text-text-primary leading-[0.75rem]'
});

const formatInfo = (projectName: string, summary: DeploySummary) => {
	const branch = summary.branch ? `${summary.branch}: ` : '';
	const revision = summary.revision ? summary.revision : '';
	const date = summary.date ? `${summary.date}` : '';
	const latestTag = summary.latestTag ? `${summary.latestTag}` : '';

	return `${projectName}: (${branch}${revision}), ${date} — ${latestTag}`;
};

export interface DeployInfoString {
	summary: DeploySummary;
	projectName: string;
}

export const DeployInfoString = forwardRef<
	HTMLAnchorElement | HTMLSpanElement,
	DeployInfoString
>(({ summary, projectName }, ref) => {
	const resultString = formatInfo(projectName, summary);

	return (
		<span className={textStyles()} ref={ref}>
			{resultString}
		</span>
	);
});

export interface DeployInfoErrorProps {
	error: unknown;
}

export const DeployInfoError = ({ error }: DeployInfoErrorProps) => {
	const { status, title, description } = getErrorMessage(error);

	return (
		<div
			className={`${wrapperStyles({
				isError: true,
				isLoading: false
			})} max-w-[275px]`}
		>
			<div className="grid flex-grow place-items-center">
				<div>
					<h3 className={`font-bold mb-1 ${textStyles()}`}>
						{status} {title}
					</h3>
					<p className={textStyles()}>{description}</p>
				</div>
			</div>
		</div>
	);
};

export const DeployInfoEmpty = () => {
	return (
		<div className={wrapperStyles({ isLoading: false, isError: false })}>
			<div className="grid flex-grow place-items-center">
				<span className={textStyles()}>No revisions found</span>
			</div>
		</div>
	);
};

export const DeployInfoLoading = () => {
	return <div className={wrapperStyles({ isLoading: true, isError: false })} />;
};

export interface DeploySummary {
	branch?: string;
	date: string;
	revision: string;
	summary: string;
	latestTag?: string;
}

export interface DeployInfoProps {
	projectName?: string;
	frontend: DeploySummary;
	backend?: DeploySummary;
}

export const DeployInfo = (props: DeployInfoProps) => {
	const { projectName, frontend, backend } = props;

	const backendGitInfo = backend ? (
		<Tooltip content={backend.summary}>
			<div className="inline-flex">
				<DeployInfoString projectName="Bublik API" summary={backend} />
			</div>
		</Tooltip>
	) : (
		<span className={textStyles()}>Could not fetch backend revision info!</span>
	);

	const projectNameNode = projectName ? (
		<span className={textStyles()}>Project: {projectName}</span>
	) : (
		<span className={textStyles()}>Could not fetch project name!</span>
	);

	return (
		<div className={wrapperStyles({ isLoading: false, isError: false })}>
			{projectNameNode}
			{backendGitInfo}
			<Tooltip content={frontend.summary}>
				<div className="inline-flex">
					<DeployInfoString projectName="Bublik UI" summary={frontend} />
				</div>
			</Tooltip>
		</div>
	);
};

export const DeployInfoContainer = () => {
	const { data, isLoading } = useGetDeployInfoQuery();

	const backendGitInfo = useMemo(() => {
		if (!data) return undefined;
		if (!data?.backendGitInfo?.latestCommit?.commitRev) return undefined;

		return {
			branch: data.backendGitInfo.repoBranch,
			date: formatTimeToDot(data?.backendGitInfo?.latestCommit?.commitDate),
			revision: data?.backendGitInfo?.latestCommit?.commitRev,
			summary: data?.backendGitInfo?.latestCommit?.commitSummary,
			latestTag: data?.backendGitInfo?.repoTag
		};
	}, [data]);

	if (isLoading) return <DeployInfoLoading />;

	return (
		<DeployInfo
			projectName={data?.projectName}
			frontend={deployInfo}
			backend={backendGitInfo}
		/>
	);
};
