/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { ConfigsPage } from '../../../pages/configs';

export const Route = createFileRoute('/_app/admin/config')({
	component: ConfigsPage
});
