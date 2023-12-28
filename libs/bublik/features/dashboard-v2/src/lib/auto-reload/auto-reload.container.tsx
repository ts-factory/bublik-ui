/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useDashboardReload } from '../hooks';

import { AutoReloadToggle } from './auto-reload.component';

export const AutoReloadContainer = () => {
	const { isEnabled, setIsEnabled } = useDashboardReload();

	return (
		<AutoReloadToggle checked={isEnabled} onCheckedChange={setIsEnabled} />
	);
};
