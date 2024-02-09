/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

import { LogPageMode } from '@/shared/types';
import { usePrefetchLogPage, usePrefetchRun } from '@/services/bublik-api';
import { CardHeader, RunModeToggle } from '@/shared/tailwind-ui';
import { LogFeature, useLogPage } from '@/bublik/features/log';
import { RunDetailsContainer } from '@/bublik/features/run-details';
import { useUserPreferences } from '@/bublik/features/user-preferences';

export interface LogHeaderProps {
	runId: string;
}

const LogHeader = ({ runId }: LogHeaderProps) => {
	const [isFullMode, setIsFullMode] = useState(false);

	return (
		<div className="flex flex-col bg-white rounded-md">
			<CardHeader label="Info">
				<RunModeToggle
					isFullMode={isFullMode}
					onToggleClick={() => setIsFullMode(!isFullMode)}
				/>
			</CardHeader>
			<div className="flex-grow min-h-[200px]">
				<RunDetailsContainer runId={runId} isFullMode={isFullMode} />
			</div>
		</div>
	);
};

export const useExperimentalLogRedirect = () => {
	const [searchParams] = useSearchParams();
	const { userPreferences } = useUserPreferences();

	const shouldRedirect =
		searchParams.get('experimental') === 'true'
			? false
			: userPreferences.log.makeExperimentalModeDefault &&
			  !searchParams.get('experimental')
			? true
			: false;

	const redirectLocation = useMemo(() => {
		const nextParams = new URLSearchParams(searchParams);
		nextParams.set('experimental', 'true');

		return { search: nextParams.toString() };
	}, [searchParams]);

	return { shouldRedirect, location: redirectLocation };
};

export const LogPage = () => {
	const { runId, mode } = useLogPage();
	const { location, shouldRedirect } = useExperimentalLogRedirect();

	usePrefetchLogPage({ runId });
	usePrefetchRun({ runId });

	const isTreeShown =
		mode === LogPageMode.TreeAndInfoAndLog || mode === LogPageMode.TreeAndLog;

	const isHeaderShown =
		mode === LogPageMode.InfoAndLog || mode === LogPageMode.TreeAndInfoAndLog;

	if (!runId) return <div>No Run ID!</div>;

	if (shouldRedirect) return <Navigate to={location} />;

	return (
		<div className="flex h-screen gap-1 p-2 overflow-y-hidden">
			<LogFeature runId={runId} isTreeShown={isTreeShown}>
				{isHeaderShown ? <LogHeader runId={runId} /> : null}
			</LogFeature>
		</div>
	);
};
