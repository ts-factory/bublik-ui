/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Navigate, useLocation, useParams } from 'react-router-dom';

export const RedirectToDashboard = () => {
	const location = useLocation();

	return (
		<Navigate
			to={{ pathname: '/dashboard', search: location.search }}
			replace
		/>
	);
};

export const RedirectToLogPage = () => {
	const { runId } = useParams();
	const location = useLocation();

	const searchWithMode = new URLSearchParams(location.search);
	searchWithMode.append('mode', 'treeAndinfoAndlog');

	return (
		<Navigate
			to={{ pathname: `/log/${runId}`, search: searchWithMode.toString() }}
		/>
	);
};
