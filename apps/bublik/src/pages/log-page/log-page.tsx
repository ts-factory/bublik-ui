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
import { CopyShortUrlButtonContainer } from '@/bublik/features/copy-url';
import { BublikEmptyState } from '@/bublik/features/ui-state';

export interface LogHeaderProps {
	runId: string;
}

const LogHeader = ({ runId }: LogHeaderProps) => {
	const [isFullMode, setIsFullMode] = useState(false);

	return (
		<div className="flex flex-col bg-white rounded-md">
			<CardHeader label="Info">
				<div className="flex gap-2 items-center">
					<RunModeToggle
						isFullMode={isFullMode}
						onToggleClick={() => setIsFullMode(!isFullMode)}
					/>
					<CopyShortUrlButtonContainer />
				</div>
			</CardHeader>
			<div className="flex-grow">
				<RunDetailsContainer runId={runId} isFullMode={isFullMode} />
			</div>
		</div>
	);
};

export const useLegacyLogRedirect = () => {
	const [searchParams] = useSearchParams();
	const { userPreferences } = useUserPreferences();

	const shouldRedirect = !!(
		userPreferences.log.preferLegacyLog && !searchParams.get('legacy')
	);

	const redirectLocation = useMemo(() => {
		const nextParams = new URLSearchParams(searchParams);
		nextParams.set('legacy', 'true');
		nextParams.delete('experimental');

		return { search: nextParams.toString() };
	}, [searchParams]);

	return { shouldRedirect, location: redirectLocation };
};

export const LogPage = () => {
	const { runId, mode } = useLogPage();
	const { location, shouldRedirect } = useLegacyLogRedirect();

	usePrefetchLogPage({ runId });
	usePrefetchRun({ runId });

	const isTreeShown =
		mode === LogPageMode.TreeAndInfoAndLog || mode === LogPageMode.TreeAndLog;

	const isHeaderShown =
		mode === LogPageMode.InfoAndLog || mode === LogPageMode.TreeAndInfoAndLog;

	if (!runId) {
		return <BublikEmptyState title="No data" description="Run ID is missing" />;
	}

	if (shouldRedirect) return <Navigate to={location} />;

	return (
		<div className="flex h-screen h-svh gap-1 p-2 overflow-y-hidden">
			<LogFeature runId={runId} isTreeShown={isTreeShown}>
				{isHeaderShown ? <LogHeader runId={runId} /> : null}
			</LogFeature>
		</div>
	);
};
