/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { defineSearch, str, type InferSearch } from '@/router';

/**
 * `/auth/login`. `redirect_url` is the absolute URL to return
 * to after signing in; without it the dashboard is the target.
 */
const loginSearch = defineSearch({ redirect_url: str() });

type LoginSearch = InferSearch<typeof loginSearch>;

export { loginSearch };
export type { LoginSearch };
