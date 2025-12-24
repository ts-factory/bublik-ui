/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { formatTimeToDot } from '@/shared/utils';
import { cva, Tooltip } from '@/shared/tailwind-ui';
import {
	bublikAPI,
	getErrorMessage,
	VersionSummary
} from '@/services/bublik-api';

import frontendInfo from '../git-info.json';

const frontendVersion: VersionSummary = {
	branch: frontendInfo.branch,
	revision: frontendInfo.revision,
	date: new Date(frontendInfo.date),
	tag: frontendInfo.latestTag,
	summary: frontendInfo.summary
};

const wrapper = cva({
	base: 'flex flex-col py-3 px-3.5 rounded-lg text-white min-w-[375px] min-h-[40px] h-full',
	variants: {
		state: {
			loading: 'animate-pulse bg-[#FFDD86]',
			error: 'bg-bg-fillError',
			success: 'bg-[#FFDD86]'
		}
	}
});

const text = cva({ base: 'text-sm leading-6 text-text-secondary' });

const formatVersion = (name: string, summary: VersionSummary) => {
	const branch = summary.branch ? `${summary.branch}: ` : '';
	const revision = summary.revision ? summary.revision : '';
	const date =
		summary.date &&
		summary.date instanceof Date &&
		!isNaN(summary.date.getTime())
			? `${formatTimeToDot(summary.date.toISOString())}`
			: '';
	const latestTag = summary.tag ? `— ${summary.tag}` : '';
	return `${name}: (${branch}${revision}), ${date} ${latestTag}`;
};

export interface FormattedVersionInfoProps {
	version: VersionSummary;
	name: string;
}

function FormattedVersionInfo(props: FormattedVersionInfoProps) {
	const { version, name } = props;
	const formatted = formatVersion(name, version);

	return <span className={text()}>{formatted}</span>;
}

function DeployInfoLoading() {
	return <div className={wrapper({ state: 'loading' })} />;
}

interface VersionProps {
	name: string;
	version: VersionSummary;
}

function Version(props: VersionProps) {
	const { name, version } = props;
	return (
		<Tooltip
			content={version.summary ?? ''}
			align="start"
			disabled={!version.summary}
		>
			<div className="inline-flex">
				<FormattedVersionInfo name={name} version={version} />
			</div>
		</Tooltip>
	);
}

function ApiVersion() {
	const serverInfoQuery = bublikAPI.useGetServerVersionQuery(undefined, {
		refetchOnMountOrArgChange: true
	});

	if (serverInfoQuery.error) {
		const error = getErrorMessage(serverInfoQuery.error);
		return <span className={text()}>API: {error.description}</span>;
	}

	if (!serverInfoQuery.data) {
		return <span className={text()}>API: Not found</span>;
	}

	return <Version name="API" version={serverInfoQuery.data} />;
}

function UiVersion() {
	return <Version name="UI" version={frontendVersion} />;
}

function DeployInfoContainer() {
	const serverInfoQuery = bublikAPI.useGetServerVersionQuery();

	const isLoading = serverInfoQuery.isLoading;
	if (isLoading) {
		return <DeployInfoLoading />;
	}

	return (
		<div className={wrapper({ state: 'success' })}>
			<ApiVersion />
			<UiVersion />
		</div>
	);
}

export { DeployInfoContainer };
