/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Navigate, useLocation, useParams } from 'react-router-dom';

import { LogPageMode, isLogPageMode } from '@/shared/types';

export const RedirectToDashboard = () => {
	const location = useLocation();

	return (
		<Navigate
			to={{ pathname: '/dashboard', search: location.search }}
			replace
		/>
	);
};

/**
 * `/log/:runId/:old` predates the `mode` param; the backend still sends
 * `/log/:id/treeAndinfoAndlog` and `/log/:id/infoAndlog` here. A layout in
 * `:old` becomes the one `mode`; anything else keeps the search's own mode or
 * falls back to the tree, info and log, as these links always opened.
 */
export function getLegacyLogRedirectSearch(
	old: string | undefined,
	search: string
): string {
	const params = new URLSearchParams(search);

	if (isLogPageMode(old)) {
		params.set('mode', old);
	} else if (!params.get('mode')) {
		params.set('mode', LogPageMode.TreeAndInfoAndLog);
	}

	return params.toString();
}

export const RedirectToLogPage = () => {
	const { runId, old } = useParams();
	const location = useLocation();

	return (
		<Navigate
			to={{
				pathname: `/log/${runId}`,
				search: getLegacyLogRedirectSearch(old, location.search),
				hash: location.hash
			}}
			replace
		/>
	);
};

/**
 * Issues moved out of `/admin` to the top level. Shared links to the old routes
 * must keep working and must arrive with their state intact: `project` is
 * multi-valued and `_s` carries the whole sidebar memory, so the search string
 * is forwarded verbatim rather than rebuilt. `replace` keeps the old URL out of
 * the history stack so Back leaves the page instead of bouncing.
 */
export const RedirectToIssues = () => {
	const params = useParams();
	const location = useLocation();
	const rest = params['*'];

	return (
		<Navigate
			to={{
				pathname: rest ? `/issues/${rest}` : '/issues',
				search: location.search,
				hash: location.hash
			}}
			replace
		/>
	);
};
