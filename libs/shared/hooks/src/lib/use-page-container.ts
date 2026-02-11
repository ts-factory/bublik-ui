/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useMemo } from 'react';

function usePageContainer() {
	return useMemo(() => {
		if (typeof document === 'undefined') return null;

		return document.getElementById('page-container');
	}, []);
}

export { usePageContainer };
