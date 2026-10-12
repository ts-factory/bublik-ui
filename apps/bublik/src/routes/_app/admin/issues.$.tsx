/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute, redirect } from '@tanstack/react-router';

// Issues moved out of `/admin` to the top level. Shared links to the old
// addresses must keep working with their state intact: `project` is
// multi-valued and `_s` carries the whole sidebar memory, so the search and
// hash are forwarded verbatim. `replace` keeps the old URL out of the history
// stack so Back leaves the page instead of bouncing.
export const Route = createFileRoute('/_app/admin/issues/$')({
	beforeLoad: ({ params }) => {
		// The splat is joined as a path, not passed as a param, so a nested
		// `/admin/issues/5/extra` stays `/issues/5/extra` instead of `/issues/5%2Fextra`.
		const to = params._splat ? `/issues/${params._splat}` : '/issues';

		throw redirect({ to, search: true, hash: true, replace: true });
	}
});
