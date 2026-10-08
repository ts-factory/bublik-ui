/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { FlowerFeature } from '../../../pages/developers-page';

export const Route = createFileRoute('/_app/admin/flower')({
	component: FlowerFeature
});
