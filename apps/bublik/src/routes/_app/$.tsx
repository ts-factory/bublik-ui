/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { NoMatchFeature } from '../../pages/not-found-page';

// The `*` route of the React Router tree: an unknown address keeps its URL
// and renders the not-found page inside the app shell. Without it an unknown
// URL would match nothing below the root and render outside the shell.
export const Route = createFileRoute('/_app/$')({
	component: NoMatchFeature
});
