/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { PropsWithChildren, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
	readLastProjectIds,
	withLastProjectIds
} from '../lib/last-project.utils';

/**
 * Opens a fresh tab on the project last picked in the sidebar when its URL
 * names none. It runs once on mount, so choosing All later is not undone, and
 * holds the page back until then so nothing loads unscoped first.
 */
function RestoreLastProjectContainer({ children }: PropsWithChildren) {
	const [searchParams, setSearchParams] = useSearchParams();
	const [restored] = useState(() =>
		withLastProjectIds(searchParams, readLastProjectIds())
	);
	const [isPending, setIsPending] = useState(restored !== null);

	useEffect(() => {
		if (!restored) return;

		setSearchParams(restored, { replace: true });
		setIsPending(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- once per mount
	}, []);

	if (isPending) return null;

	return children;
}

export { RestoreLastProjectContainer };
