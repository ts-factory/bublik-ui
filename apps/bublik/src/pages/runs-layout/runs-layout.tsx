/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { Outlet } from 'react-router-dom';

import { SelectionPopoverContainer } from '@/bublik/features/runs';

function RunsLayout() {
	return (
		<>
			<Outlet />
			<SelectionPopoverContainer />
		</>
	);
}

export { RunsLayout };
