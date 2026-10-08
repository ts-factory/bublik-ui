/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { NoMatchFeature } from '../../../pages/not-found-page';

// Bare `/admin` renders the not-found page inside the admin layout, as today.
export const Route = createFileRoute('/_app/admin/')({
	component: NoMatchFeature
});
