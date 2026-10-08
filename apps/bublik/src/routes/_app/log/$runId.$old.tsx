/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute, redirect } from '@tanstack/react-router';

import { LogPageMode } from '@/shared/types';

// The legacy `/log/:runId/:old` address opens the log in the tree mode. The
// mode is set rather than appended and the entry is replaced.
export const Route = createFileRoute('/_app/log/$runId/$old')({
	beforeLoad: ({ params, search }) => {
		throw redirect({
			to: '/log/$runId',
			params: { runId: params.runId },
			search: { ...search, mode: LogPageMode.TreeAndInfoAndLog },
			replace: true
		});
	}
});
