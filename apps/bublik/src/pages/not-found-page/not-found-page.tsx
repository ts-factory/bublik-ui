/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { NotFound } from '@/shared/tailwind-ui';

import { useTabTitleWithPrefix } from '@/bublik/features/projects';

export const NoMatchFeature = () => {
	useTabTitleWithPrefix('Not Found - Bublik');

	return <NotFound />;
};
