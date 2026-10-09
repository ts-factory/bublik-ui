/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect, useState } from 'react';
import { getRouteApi } from '@tanstack/react-router';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { LogPageMode } from '@/shared/types';
import { usePrefetchLogPage, usePrefetchRun } from '@/services/bublik-api';
import { CardHeader, RunModeToggle } from '@/shared/tailwind-ui';
import { LogFeature, useLogSearchWriter } from '@/bublik/features/log';
import { RunDetailsContainer } from '@/bublik/features/run-details';
import { useUserPreferences } from '@/bublik/features/user-preferences';
import { CopyShortUrlButtonContainer } from '@/bublik/features/copy-url';

const routeApi = getRouteApi('/_app/log/$runId/');

export interface LogHeaderProps {
	runId: number;
}

const LogHeader = ({ runId }: LogHeaderProps) => {
	const [isFullMode, setIsFullMode] = useState(false);

	const handleModeToggle = () => {
		trackEvent(analyticsEventNames.logModeToggle, {
			enabled: !isFullMode
		});

		setIsFullMode((prev) => !prev);
	};

	return (
		<div
			className="flex flex-col bg-bg-primary rounded-md"
			data-testid="log-info"
		>
			<CardHeader label="Info">
				<div className="flex gap-2 items-center">
					<RunModeToggle
						isFullMode={isFullMode}
						onToggleClick={handleModeToggle}
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

/**
 * The "prefer legacy log" preference: a link that names no renderer is
 * pushed to `legacy=true`, the deprecated `experimental` dropped, the hash
 * and `location.state` dropped, as React Router's `<Navigate>` did. A link
 * that names one (`legacy=false` included) is left alone.
 */
export const useLegacyLogRedirect = () => {
	const { legacy } = routeApi.useSearch();
	const { userPreferences } = useUserPreferences();
	const writeLogSearch = useLogSearchWriter();

	const shouldRedirect =
		userPreferences.log.preferLegacyLog && legacy === undefined;

	useEffect(() => {
		if (!shouldRedirect) return;

		writeLogSearch({ legacy: true, experimental: undefined });
	}, [shouldRedirect, writeLogSearch]);

	return { shouldRedirect };
};

export const LogPage = () => {
	const { runId } = routeApi.useParams();
	const { mode } = routeApi.useSearch();
	const { shouldRedirect } = useLegacyLogRedirect();

	usePrefetchLogPage({ runId });
	usePrefetchRun({ runId });

	const isTreeShown =
		mode === LogPageMode.TreeAndInfoAndLog || mode === LogPageMode.TreeAndLog;

	const isHeaderShown =
		mode === LogPageMode.InfoAndLog || mode === LogPageMode.TreeAndInfoAndLog;

	if (shouldRedirect) return null;

	return (
		<div
			className="flex h-screen h-svh gap-1 p-2 overflow-y-hidden"
			data-testid="log-page"
			data-log-mode={mode ?? ''}
		>
			<LogFeature runId={runId} isTreeShown={isTreeShown}>
				{isHeaderShown ? <LogHeader runId={runId} /> : null}
			</LogFeature>
		</div>
	);
};
