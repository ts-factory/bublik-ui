/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createPath, type To } from 'react-router-dom';

export function toString(to: To): string {
	if (typeof to === 'string') return to;
	return createPath(to);
}
