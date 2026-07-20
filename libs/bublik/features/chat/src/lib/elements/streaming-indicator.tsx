/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { Shimmer } from './shimmer';

/** Shown after tool calls complete while waiting for text generation to start. */
export function StreamingIndicator() {
	return (
		<div className="py-2">
			<Shimmer className="text-[0.8125rem]">Generating response…</Shimmer>
		</div>
	);
}
